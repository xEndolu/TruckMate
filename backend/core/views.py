import logging
import random
import base64
import json
import os
import re
import cv2
import numpy as np
import openai

from django.contrib.auth import get_user_model
from django.shortcuts import render
from django.contrib.auth.mixins import UserPassesTestMixin

from rest_framework import generics, status
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.response import Response
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from rest_framework.views import APIView
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from django.utils import timezone
from decimal import Decimal, InvalidOperation
from statistics import mean

from .serializers import UserRegistrationSerializer, UserSerializer, OTPVerificationSerializer
from .gmail_auth import get_gmail_service
from .models import User, TruckAssessment
 
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.generic import ListView
from django.conf import settings
from django.shortcuts import get_object_or_404
from ultralytics import YOLO

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.documents import Document
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_community.document_loaders.csv_loader import CSVLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores.faiss import FAISS
from langchain.chains import create_retrieval_chain
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.prompts import MessagesPlaceholder
from langchain.chains.history_aware_retriever import create_history_aware_retriever

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

User = get_user_model()

@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def user_profile(request):
    user = request.user

    data = {
        'email': user.email,
        'registration_date': user.date_joined.strftime('%Y-%m-%d'),
    }

    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_data(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

class AdminRequiredMixin(UserPassesTestMixin):
    def test_func(self):
        return self.request.user.is_authenticated and self.request.user.is_admin_user()

class AssessmentListView(AdminRequiredMixin, ListView):
    model = TruckAssessment
    template_name = 'assessment_list.html'
    context_object_name = 'assessments'

class AdminDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_admin_user():
            return Response({"error": "You do not have permission to access this page."}, status=403)

        assessments = TruckAssessment.objects.order_by('-priority_score', '-assessment_date')
        total_assessments = assessments.count()
        high_priority_assessments = assessments.filter(priority_score__gte=7).count()

        data = {
            'total_assessments': total_assessments,
            'high_priority_assessments': high_priority_assessments,
            'assessments': [
                {
                    'id': assessment.id,
                    'truck_id': assessment.truck_id,
                    'assessment_date': assessment.assessment_date,
                    'severity_score': assessment.severity_score,  # Added this line
                    'priority_score': assessment.priority_score,
                    'urgency_level': assessment.urgency_level,
                    'estimated_repair_cost': str(assessment.estimated_repair_cost)
                }
                for assessment in assessments  # Removed the [:10] limit for now
            ]
        }

        return Response(data)

class UserRegistrationView(generics.CreateAPIView):
    serializer_class = UserRegistrationSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate OTP
        otp = str(random.randint(100000, 999999))
        user.otp = otp
        user.otp_expiration = timezone.now() + timezone.timedelta(minutes=30)
        user.save()

        # Send OTP via email using Gmail API
        service = get_gmail_service()
        message = MIMEMultipart()
        message['to'] = user.email
        message['subject'] = 'OTP Verification'
        message.attach(MIMEText(f'Your OTP is: {otp}'))
        create_message = {'raw': base64.urlsafe_b64encode(message.as_bytes()).decode()}
        try:
            send_message = (service.users().messages().send(userId="me", body=create_message).execute())
            logger.info(f"OTP email sent successfully to {user.email}")
            return Response({'message': 'User registered successfully. Please verify your email.'}, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Failed to send email: {str(e)}")
            return Response({'error': 'Failed to send email'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class UserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        serializer = UserSerializer(user)
        return Response(serializer.data)

@api_view(['POST'])
def verify_otp(request):
    serializer = OTPVerificationSerializer(data=request.data)
    if serializer.is_valid():
        otp = serializer.validated_data['otp']
        try:
            user = User.objects.get(otp=otp)
            if user.otp_expiration > timezone.now():
                user.is_verified = True
                user.save()
                token, created = Token.objects.get_or_create(user=user)
                return Response({'message': 'OTP verification successful.', 'token': token.key}, status=status.HTTP_200_OK)
            else:
                return Response({'message': 'OTP has expired.'}, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({'message': 'Invalid OTP.'}, status=status.HTTP_400_BAD_REQUEST)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserLoginView(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        return Response({'token': token.key})

def home(request):
    return render(request, 'home.html')

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        serializer = UserSerializer(user)
        return Response(serializer.data)

    def put(self, request):
        user = request.user
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

    
def get_documents_from_services():
    csv_path = os.path.join(settings.BASE_DIR, 'data', 'TruckMate.csv')
    loader = CSVLoader(file_path=csv_path)
    data = loader.load()

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=200,
        chunk_overlap=20
    )
    splitData = splitter.split_documents(data) 

    return splitData

def create_db(data):
    embedding = OpenAIEmbeddings()
    vectorStore = FAISS.from_documents(data, embedding=embedding)
    return vectorStore

def create_chain(vectorStore):
    model = ChatOpenAI(
        model="gpt-3.5-turbo-1106",
        temperature=0.2,
        max_tokens=2000,
    )
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an AI Truck mechanic. Every request or question is truck-related, depending on what they talk about. Answer their question with a truck-related solution, if asked. Only suggest R+M services, if asked. Also, Answer the user's questions based on the context: {context}"),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human","{input}")
    ])
    chain = create_stuff_documents_chain(
        llm=model,
        prompt=prompt
    )
    retriever = vectorStore.as_retriever()
    retriever_prompt = ChatPromptTemplate.from_messages([
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "{input}"),
        ("human", "Given the above conversation, generate a search query to look up in order to get information relevant to the conversation")
    ])
    history_aware_retriever = create_history_aware_retriever(
        llm=model,
        retriever=retriever,
        prompt=retriever_prompt
    )
    retrieval_chain = create_retrieval_chain(
        history_aware_retriever,
        chain
    )
    return retrieval_chain

# Initialize the chain
data = get_documents_from_services()
vectorStore = create_db(data)
chain = create_chain(vectorStore)

@csrf_exempt
@csrf_exempt
def chatbot(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        user_input = data['message']
        chat_history = data.get('chat_history', [])

        # Convert chat history to HumanMessage and AIMessage objects
        langchain_history = []
        for message in chat_history:
            if message['role'] == 'human':
                langchain_history.append(HumanMessage(content=message['content']))
            elif message['role'] == 'assistant':
                langchain_history.append(AIMessage(content=message['content']))

        response = chain.invoke({
            "input": user_input,
            "chat_history": langchain_history,
        })
        
        # Convert the response back to a serializable format
        serializable_history = chat_history + [
            {'role': 'human', 'content': user_input},
            {'role': 'assistant', 'content': response["answer"]}
        ]
        
        return JsonResponse({
            'response': response["answer"],
            'chat_history': serializable_history
        })
    return JsonResponse({'error': 'Invalid request method'}, status=400)

def calculate_multiple_damage_scores(damages, chatbot_assessment):
    severity_mapping = {'low': 3, 'minor': 3, 'moderate': 6, 'high': 9, 'severe': 9}
    total_confidence = sum(float(d['confidence']) for d in damages)
    total_severity = 0
    total_cost = 0

    for damage in damages:
        severity_match = re.search(rf"{re.escape(damage['area'])}.*?Severity:\s*(\w+)", chatbot_assessment, re.IGNORECASE | re.DOTALL)
        cost_match = re.search(rf"{re.escape(damage['area'])}.*?Estimated Cost:\s*₱([\d,]+)", chatbot_assessment, re.IGNORECASE | re.DOTALL)
        
        if severity_match:
            severity_word = severity_match.group(1).lower()
            severity_score = severity_mapping.get(severity_word, 5)
        else:
            severity_score = 5  # Default to moderate if not found
        
        confidence = float(damage['confidence'])
        total_severity += severity_score * confidence

        if cost_match:
            cost = int(cost_match.group(1).replace(',', ''))
        else:
            cost = PHILIPPINE_REPAIR_COSTS.get(damage['area'].lower(), 1000)
        total_cost += cost

    weighted_severity = total_severity / total_confidence if total_confidence > 0 else 5
    normalized_severity = min(10, weighted_severity)

    # Determine urgency based on highest individual severity
    max_severity = max((severity_mapping.get(re.search(rf"{re.escape(d['area'])}.*?Severity:\s*(\w+)", chatbot_assessment, re.IGNORECASE | re.DOTALL).group(1).lower(), 5) if re.search(rf"{re.escape(d['area'])}.*?Severity:\s*(\w+)", chatbot_assessment, re.IGNORECASE | re.DOTALL) else 5) for d in damages)
    
    if max_severity <= 3:
        urgency = 'low'
    elif max_severity <= 6:
        urgency = 'medium'
    else:
        urgency = 'high'

    urgency_value = {'low': 1, 'medium': 2, 'high': 3}[urgency]
    priority_score = (normalized_severity * 0.4) + (min(total_cost / 10000, 1) * 0.3) + (urgency_value * 0.3)

    return normalized_severity, min(10, priority_score), total_cost, urgency


def parse_chatbot_response(chatbot_assessment, damages):
    logger.info(f"Parsing chatbot response: {chatbot_assessment}")
    
    try:
        severity_score, priority_score, estimated_repair_cost, urgency_level = calculate_multiple_damage_scores(damages, chatbot_assessment)
    except Exception as e:
        logger.error(f"Error in calculate_multiple_damage_scores: {str(e)}")
        severity_score = 5.0  # Default to moderate
        priority_score = 5.0  # Default to medium priority
        estimated_repair_cost = sum(PHILIPPINE_REPAIR_COSTS.get(d['area'].lower(), 1000) for d in damages)
        urgency_level = 'medium'

    # Generate a priority explanation based on our calculations
    priority_explanation = generate_priority_explanation(severity_score, estimated_repair_cost, urgency_level, damages, priority_score)

    logger.info(f"Calculated values: Severity: {severity_score}, Cost: {estimated_repair_cost}, Urgency: {urgency_level}, Priority: {priority_score}")

    return severity_score, estimated_repair_cost, urgency_level, priority_score, priority_explanation, chatbot_assessment

def generate_priority_explanation(severity_score, estimated_repair_cost, urgency_level, damages, priority_score):
    explanation = f"The priority score of {priority_score:.2f} is based on:\n"
    explanation += f"- Severity: {severity_score:.2f}/10 (considering {len(damages)} damage{'s' if len(damages) > 1 else ''})\n"
    explanation += f"- Estimated Repair Cost: ₱{estimated_repair_cost:.2f}\n"
    explanation += f"- Urgency Level: {urgency_level.capitalize()}\n\n"
    explanation += f"This score indicates {'immediate attention' if priority_score > 7 else 'prompt repair' if priority_score > 4 else 'scheduled maintenance'} is needed."
    return explanation

def safe_float(value):
    try:
        return float(value)
    except (ValueError, TypeError):
        return None

def safe_decimal(value):
    try:
        return Decimal(value)
    except (InvalidOperation, TypeError):
        return None

def calculate_severity_score(damages):
    if not damages:
        return 0.0
    total_confidence = sum(float(d['confidence']) for d in damages)
    weighted_severity = sum(10 * float(d['confidence']) for d in damages)
    return min(10.0, weighted_severity / total_confidence)

# Updated PHILIPPINE_REPAIR_COSTS to match YOLOv8 model classes
PHILIPPINE_REPAIR_COSTS = {
    'dent': 2000,        # Cost can vary based on size and location
    'crack': 3000,       # Cost can vary based on size and location
    'shattered_glass': 8000,  # Assuming this mainly refers to windshield
    'broken_lamp': 3500,      # Average cost for headlight/taillight replacement
    'flat_tire': 1500,        # Cost of tire replacement, might be lower for repair
    'scratch': 1000,          # Cost can vary based on severity and size
}

def estimate_repair_cost(damages):
    total_cost = Decimal('0')
    for damage in damages:
        damage_type = damage['area'].lower()
        confidence = float(damage['confidence'])
        
        # Map detected damage to repair cost category
        if 'glass' in damage_type or 'windshield' in damage_type:
            cost_key = 'shattered_glass'
        elif 'lamp' in damage_type or 'light' in damage_type:
            cost_key = 'broken_lamp'
        elif 'tire' in damage_type:
            cost_key = 'flat_tire'
        else:
            cost_key = damage_type  # For 'dent', 'crack', and 'scratch'
        
        base_cost = PHILIPPINE_REPAIR_COSTS.get(cost_key, 2000)  # Default to 2000 PHP if type not found
        
        # Adjust cost based on confidence (assuming confidence affects the extent of damage)
        adjusted_cost = base_cost * confidence
        
        # For dents and scratches, consider multiple instances
        if damage_type in ['dent', 'scratch']:
            # Assume cost increases but with diminishing returns for multiple instances
            instance_factor = min(Decimal('2.0'), Decimal('1.0') + (Decimal('0.2') * (damages.count(damage) - 1)))
            adjusted_cost *= instance_factor
        
        total_cost += Decimal(str(adjusted_cost))
    
    # Round to nearest 100 PHP
    return total_cost.quantize(Decimal('100'))

def calculate_urgency_level(severity_score, damages):
    damage_count = len(damages)
    if severity_score >= 7 or damage_count > 3:
        return 'high'
    elif severity_score >= 4 or damage_count > 1:
        return 'medium'
    else:
        return 'low'

def calculate_priority_score(severity_score, estimated_repair_cost, urgency_level, damages):
    urgency_value = {'low': 1, 'medium': 2, 'high': 3}.get(urgency_level, 2)
    damage_factor = min(1, len(damages) / 6)  # Increases with more damages, max out at 6 damages (number of damage types)
    
    # Adjust cost factor based on typical repair costs in the Philippines
    cost_factor = min(float(estimated_repair_cost or 0) / 25000, 1)  # Assuming 25,000 PHP as a high-end repair for trucks
    
    return min(10.0, (severity_score * 0.4) + (cost_factor * 0.3) + (urgency_value * 0.2) + (damage_factor * 0.1))



# Set up the OpenAI client
logger = logging.getLogger(__name__)
client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)

model = YOLO(r'C:\Users\kennj\Desktop\tas\truck_assessment\backend\last.pt')

CHATBOT_PROMPT = """You are an expert in truck damage assessment. Provide a concise assessment of the damages, including replacement/repair recommendations and costs in Philippine Pesos (₱). For each detected damage, provide the following information:

Damage Assessment:
[For each damage]
* Area: [Damage area]
* Severity: [Low/Moderate/High]
* Recommended Action: [Brief repair recommendation]
* Estimated Cost: ₱[Estimated cost in PHP]

Do not provide an overall assessment or explanation. Focus on assessing each individual damage accurately."""

@csrf_exempt
def assess_damage(request):
    if request.method == 'POST' and request.FILES.get('image'):
        try:
            uploaded_file = request.FILES['image']
            img_array = np.frombuffer(uploaded_file.read(), np.uint8)
            img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

            results = model(img)
            damages = []

            for box in results[0].boxes:
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                conf = box.conf.item()
                cls = int(box.cls.item())
                class_name = model.names[cls]
                
                damages.append({
                    'area': class_name,
                    'confidence': f"{conf:.2f}"
                })

                cv2.rectangle(img, (int(x1), int(y1)), (int(x2), int(y2)), (0, 255, 0), 2)
                cv2.putText(img, f"{class_name}: {conf:.2f}", (int(x1), int(y1) - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)

            img_name = f"assessment_{TruckAssessment.objects.count() + 1}.jpg"
            img_path = os.path.join(settings.MEDIA_ROOT, 'assessments', img_name)
            os.makedirs(os.path.dirname(img_path), exist_ok=True)
            cv2.imwrite(img_path, img)

            _, img_encoded = cv2.imencode('.jpg', img)
            img_base64 = base64.b64encode(img_encoded).decode('utf-8')

            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": CHATBOT_PROMPT},
                    {"role": "user", "content": f"Assess the following truck damages: {damages}"}
                ]
            )
            chatbot_assessment = response.choices[0].message.content
            logger.info(f"Full Chatbot response: {chatbot_assessment}")

            parsed_data = parse_chatbot_response(chatbot_assessment, damages)
            severity_score, estimated_repair_cost, urgency_level, priority_score, priority_explanation, overall_assessment = parsed_data

            # Create a single TruckAssessment object for all damages
            assessment = TruckAssessment.objects.create(
                truck_id=f"TRUCK-{TruckAssessment.objects.count() + 1}",
                damage_description=chatbot_assessment,
                image_url=img_path,
                damages=damages,
                severity_score=Decimal(str(severity_score)),
                estimated_repair_cost=Decimal(str(estimated_repair_cost)),
                urgency_level=urgency_level,
                priority_score=Decimal(str(priority_score)),
                priority_explanation=priority_explanation
            )

            response_data = {
                'damages': damages, 
                'image': img_base64,
                'assessment': chatbot_assessment,
                'severity_score': f"{severity_score:.2f}",
                'estimated_repair_cost': f"₱ {estimated_repair_cost:.2f}",
                'urgency_level': urgency_level.capitalize(),
                'priority_score': f"{priority_score:.2f}",
                'priority_explanation': priority_explanation
            }

            return JsonResponse(response_data)

        except Exception as e:
            logger.exception(f"Error in assess_damage view: {str(e)}")
            return JsonResponse({'error': str(e)}, status=500)
    else:
        return JsonResponse({'error': 'Invalid request'}, status=400)