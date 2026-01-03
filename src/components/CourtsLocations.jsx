import { useState, useEffect } from 'react';
import { supabase } from '../scripts/supabaseClient';
import '../styles/CourtsLocations.css';

export const CourtsLocations = () => {
  const [locations, setLocations] = useState([]);
  const [courtGroups, setCourtGroups] = useState([]);
  const [expandedLocation, setExpandedLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadLocationsAndCourts = async () => {
      try {
        setLoading(true);

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const headers = {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        };

        const [locationsResponse, courtGroupsResponse] = await Promise.all([
          fetch(`${supabaseUrl}/rest/v1/location?select=*&order=name.asc`, { headers }),
          fetch(`${supabaseUrl}/rest/v1/court_group?select=*,location(name,address,phone)&is_active=eq.true&order=group_name.asc`, { headers })
        ]);

        if (!locationsResponse.ok) throw new Error('Failed to fetch locations');
        if (!courtGroupsResponse.ok) throw new Error('Failed to fetch court groups');

        const locationsData = await locationsResponse.json();
        const courtGroupsData = await courtGroupsResponse.json();

        setLocations(locationsData || []);
        setCourtGroups(courtGroupsData || []);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Error loading courts and locations: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadLocationsAndCourts();
  }, []);

  const toggleLocationDetails = (locationId) => {
    setExpandedLocation(expandedLocation === locationId ? null : locationId);
  };

  if (loading) return <div className="courts-loading">Loading courts & locations...</div>;
  if (error) return <div className="courts-error">{error}</div>;

  return (
    <div className="courts-locations">
      <div className="section-header">
        <h1>Courts & Locations</h1>
        <p>Reference guide for league facilities and court assignments.</p>
      </div>

      <section className="court-groups-section">
        <div className="group-header">
          <h2>Court Assignment Cheat Sheet</h2>
          <p>Standard pairings for coordinating with opposing captains.</p>
        </div>
        {courtGroups.length > 0 ? (
          <div className="court-groups-grid">
            {courtGroups.map(courtGroup => (
              <div key={courtGroup.id} className="court-group-card card card--interactive">
                <div className="card-accent"></div>
                <h3>{courtGroup.group_name}</h3>
                <div className="group-info">
                  {courtGroup.location && (
                    <p className="info-item">
                      <span className="icon">📍</span>
                      <strong>{courtGroup.location.name}</strong>
                    </p>
                  )}
                  {courtGroup.court_numbers && courtGroup.court_numbers.length > 0 && (
                    <p className="info-item">
                      <span className="icon">🎾</span>
                      <span>Courts: {courtGroup.court_numbers.join(', ')}</span>
                    </p>
                  )}
                  {courtGroup.preferred_time && (
                    <p className="info-item">
                      <span className="icon">🕒</span>
                      <span>{courtGroup.preferred_time}</span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-data">No active court groups found.</p>
        )}
      </section>

      <section className="locations-section">
        <h2>Facility Directory</h2>
        {locations.length > 0 ? (
          <div className="locations-list">
            {locations.map(location => (
              <div key={location.id} className="location-card card">
                <div className="location-main-info">
                  <div className="location-text">
                    <h3>{location.name}</h3>
                    {location.address && <p className="location-address">{location.address}</p>}
                  </div>
                  <button
                    className={`expand-toggle ${expandedLocation === location.id ? 'active' : ''}`}
                    onClick={() => toggleLocationDetails(location.id)}
                    aria-label={expandedLocation === location.id ? 'Show less' : 'Show more'}
                  >
                    {expandedLocation === location.id ? 'Close Details' : 'View Facility Info'}
                  </button>
                </div>

                {expandedLocation === location.id && (
                  <div className="location-expanded-content">
                    <div className="details-grid">
                      <div className="details-column">
                        <h4>Facility Specs</h4>
                        <ul>
                          {location.number_of_courts > 0 && (
                            <li><strong>Total Courts:</strong> {location.number_of_courts}</li>
                          )}
                          {location.facility_type && (
                            <li><strong>Type:</strong> {location.facility_type}</li>
                          )}
                          {location.lighting_info && (
                            <li><strong>Lighting:</strong> {location.lighting_info}</li>
                          )}
                          {location.parking_info && (
                            <li><strong>Parking:</strong> {location.parking_info}</li>
                          )}
                        </ul>
                      </div>

                      <div className="details-column">
                        <h4>Contact & Access</h4>
                        <ul>
                          {location.contact_person && (
                            <li><strong>Contact:</strong> {location.contact_person}</li>
                          )}
                          {location.website_url && (
                            <li>
                              <a href={location.website_url} target="_blank" rel="noopener noreferrer">
                                Official Website ↗
                              </a>
                            </li>
                          )}
                          <li><strong>Restrooms:</strong> {location.restroom_access ? 'Available ✓' : 'Limited ⚠'}</li>
                          <li><strong>Status:</strong> {location.open_year_round ? 'Open Year-Round' : 'Seasonal'}</li>
                        </ul>
                      </div>
                    </div>

                    {location.amenities && location.amenities.length > 0 && (
                      <div className="amenities-tags">
                        {location.amenities.map((amenity, idx) => (
                          <span key={idx} className="amenity-tag">{amenity}</span>
                        ))}
                      </div>
                    )}

                    {location.photos && location.photos.length > 0 && (
                      <div className="location-gallery">
                        {location.photos.map((photo_url, idx) => (
                          <img
                            key={idx}
                            src={photo_url}
                            alt={`${location.name} preview`}
                            className="gallery-img"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="no-data">No facilities found.</p>
        )}
      </section>

      <footer className="courts-footer">
        <p className="detail-note">Confirm specific court assignments with the opposing captain prior to match arrival.</p>
      </footer>
    </div>
  );
};
