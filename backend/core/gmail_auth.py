from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from django.conf import settings
from django.core.mail.backends.smtp import EmailBackend
from google.auth.transport.requests import Request
import logging

logger = logging.getLogger(__name__)

def get_gmail_service():
    credentials = Credentials(
        token=None,
        refresh_token=settings.GOOGLE_OAUTH2_REFRESH_TOKEN,
        client_id=settings.GOOGLE_OAUTH2_CLIENT_ID,
        client_secret=settings.GOOGLE_OAUTH2_CLIENT_SECRET,
        token_uri='https://oauth2.googleapis.com/token',
    )
    service = build('gmail', 'v1', credentials=credentials)
    return service

class OAuthEmailBackend(EmailBackend):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.creds = None

    def open(self):
        if self.connection:
            return False

        try:
            self.creds = Credentials(
                token=None,
                refresh_token=settings.GOOGLE_OAUTH2_REFRESH_TOKEN,
                client_id=settings.GOOGLE_OAUTH2_CLIENT_ID,
                client_secret=settings.GOOGLE_OAUTH2_CLIENT_SECRET,
                token_uri='https://oauth2.googleapis.com/token',
            )
            
            if not self.creds.valid:
                logger.debug("Refreshing credentials")
                self.creds.refresh(Request())
            
            if not self.creds.token:
                logger.error("Failed to obtain a valid token")
                return False

            logger.debug(f"Connecting to {self.host}:{self.port}")
            self.connection = self.connection_class(self.host, self.port, **self.connection_params)
            self.connection.ehlo()
            self.connection.starttls()
            self.connection.ehlo()
            logger.debug(f"Logging in with username: {self.username}")
            self.connection.login(self.username, self.creds.token)
            logger.debug("Email connection established successfully")
            return True
        except Exception as e:
            logger.error(f"Error establishing email connection: {str(e)}")
            if not self.fail_silently:
                raise
        return False