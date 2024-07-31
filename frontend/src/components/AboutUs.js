import React from 'react';
import styles from '../styles/AboutUs.module.css';
import Navbar from './Navbar';
import image1 from '../assets/images/image1.png';
import image3 from '../assets/images/image3.png';
import image4 from '../assets/images/image4.png';

const AboutUs = ({ isLoggedIn, user, handleLogout }) => {
  return (
    <div className={styles.about_us_page}>
      <Navbar isLoggedIn={isLoggedIn} handleLogout={handleLogout} />
      <main>
        <div className={styles.about_us_content}>
          <h1>ABOUT US</h1>
          <div className={styles.content_wrapper}>
            <div className={styles.image_gallery}>
              <img src={image1} alt="Truck on the road" />
              <img src={image3} alt="Volvo truck" />
              <img src={image4} alt="Lined up trucks" />
            </div>
            <p>
              Established before 1968, R + M Auto and Truck Center at 120 Brgy. Sta. Clara, Arnaldo Highway, General Trias, Cavite, Philippines, is built on a rich heritage of automotive expertise and passion for service.
            </p>
            <h2>Our services include:</h2>
            <ul className={styles.services_list}>
              <li>Premium engine and automatic transmission oil changes with a free exterior check-up (lights, tires, brake fluids, air cleaner, etc.)</li>
              <li>Injector cleaning/flushing for better fuel efficiency</li>
              <li>Diesel and gasoline engine repair, overhaul, and replacement</li>
              <li>Comprehensive diagnostics for engine management, anti-lock brakes, airbags, transmissions, and more</li>
              <li>Under chassis, suspension, and steering repairs</li>
              <li>Tire sales, mounting, balancing, and repair</li>
              <li>Maintenance inspections and miscellaneous repairs</li>
            </ul>
            <p>
              At R + M Auto and Truck Center, we combine generations of knowledge with a commitment to quality service.
            </p>
          </div>
        </div>
      </main>
      <footer>
        <p>(046) 5389115 | +63917-6505578 | +63933-8250355</p>
        <p>R+M Auto and Truck Center - YOUR SAFE JOURNEY STARTS WITH US!</p>
        <p>&copy; 2024 TruckMate. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default AboutUs;