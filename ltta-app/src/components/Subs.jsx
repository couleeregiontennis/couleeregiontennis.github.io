import { useState } from 'react';
import '../styles/Subs.css';

export function Subs() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = [
    '/images/sub-1.jpeg',
    '/images/sub-2.jpeg',
    '/images/sub-3.jpeg',
    '/images/sub-4-5.jpeg',
  ];

  const nextImage = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  return (
    <div className="subs-page">
      <h1>Find a Sub</h1>
      <section className="sub-rules">
        <h2>Sub Policy</h2>
        <ul>
          <li>Tell your captain if you can't make a match</li>
          <li>Try to find a sub that doesn't get to play normally, before asking players from the other night</li>
          <li>Use GroupMe – it makes finding subs easier</li>
        </ul>
      </section>

      <section className="carousel-section">
        <div className="carousel">
          <button 
            className="carousel-arrow left" 
            onClick={prevImage}
            aria-label="Previous image"
          >
            ←
          </button>
          <img 
            src={images[currentImageIndex]} 
            alt={`Sub example ${currentImageIndex + 1}`}
            className="carousel-image"
          />
          <button 
            className="carousel-arrow right" 
            onClick={nextImage}
            aria-label="Next image"
          >
            →
          </button>
          <div className="carousel-dots">
            {images.map((_, index) => (
              <button
                key={index}
                className={`carousel-dot ${index === currentImageIndex ? 'active' : ''}`}
                onClick={() => setCurrentImageIndex(index)}
                aria-label={`Show image ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}