import { useState, useEffect } from 'react';
import { supabase } from '../scripts/supabaseClient';

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

        // Load all locations
        const { data: locationData, error: locationError } = await supabase
          .from('location')
          .select('*')
          .order('name', { ascending: true });

        if (locationError) throw locationError;

        // Load all court groups with location info
        const { data: courtGroupData, error: courtGroupError } = await supabase
          .from('court_group')
          .select(`
            *,
            location (name, address, phone)
          `)
          .eq('is_active', true)
          .order('group_name', { ascending: true });

        if (courtGroupError) throw courtGroupError;

        setLocations(locationData || []);
        setCourtGroups(courtGroupData || []);
      } catch (err) {
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
      <h1>Courts & Locations</h1>

      <div className="locations-section">
        <h2>All Facilities</h2>
        {locations.length > 0 ? (
          <div className="locations-list">
            {locations.map(location => (
              <div key={location.id} className="location-card">
                <div className="location-header">
                  <h3>{location.name}</h3>
                  <button
                    className="expand-btn"
                    onClick={() => toggleLocationDetails(location.id)}
                    aria-expanded={expandedLocation === location.id}
                  >
                    {expandedLocation === location.id ? '▼' : '▶'}
                  </button>
                </div>
                {location.address && (
                  <p className="location-address">
                    <strong>Address:</strong> {location.address}
                  </p>
                )}
                {location.phone && (
                  <p className="location-phone">
                    <strong>Phone:</strong> {location.phone}
                  </p>
                )}

                {expandedLocation === location.id && (
                  <div className="location-details">
                    {/* Facility Information */}
                    {location.number_of_courts > 0 && (
                      <p className="court-count">
                        <strong>{location.number_of_courts} Courts</strong> ({location.facility_type}){location.opening_date && ` • Opened ${new Date(location.opening_date).getFullYear()}`}
                      </p>
                    )}

                    {location.lighting_info && (
                      <p className="lighting-info">
                        <strong>Lighting:</strong> {location.lighting_info}
                      </p>
                    )}

                    {location.website_url && (
                      <p className="website-link">
                        <a href={location.website_url} target="_blank" rel="noopener noreferrer">
                          Visit Website
                        </a>
                      </p>
                    )}

                    {location.contact_person && (
                      <p className="contact-info">
                        <strong>Contact:</strong> {location.contact_person}
                        {location.contact_email && ` • ${location.contact_email}`}
                      </p>
                    )}

                    {location.amenities && location.amenities.length > 0 && (
                      <div className="amenities">
                        <strong>Amenities:</strong>
                        <ul>
                          {location.amenities.map((amenity, idx) => (
                            <li key={idx}>✓ {amenity}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {location.parking_info && (
                      <p className="parking-info">
                        <strong>Parking:</strong> {location.parking_info}
                      </p>
                    )}

                    {location.restroom_access && (
                      <p className="facility-feature">
                        <strong>✓ Restrooms Available</strong>
                      </p>
                    )}

                    {!location.open_year_round && (
                      <p className="facility-feature">
                        <strong>⚠ Seasonal Facility</strong>
                      </p>
                    )}

                    {/* Photos */}
                    {location.photos && location.photos.length > 0 && (
                      <div className="location-photos">
                        <strong>Photos:</strong>
                        <div className="photo-gallery">
                          {location.photos.map((photo_url, idx) => (
                            <img
                              key={idx}
                              src={photo_url}
                              alt={`${location.name} - Photo ${idx + 1}`}
                              className="location-photo"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Court Groups */}
                    <h4>Court Groups at {location.name}</h4>
                    {courtGroups
                      .filter(cg => cg.location?.name === location.name)
                      .map(courtGroup => (
                        <div key={courtGroup.id} className="court-group">
                          <h5>{courtGroup.group_name}</h5>
                          {courtGroup.court_numbers && courtGroup.court_numbers.length > 0 && (
                            <p className="court-numbers">
                              <strong>Courts:</strong> {courtGroup.court_numbers.join(', ')}
                            </p>
                          )}
                          {courtGroup.preferred_time && (
                            <p className="preferred-time">
                              <strong>Preferred Time:</strong> {courtGroup.preferred_time}
                            </p>
                          )}
                        </div>
                      ))}
                    {courtGroups.filter(cg => cg.location?.name === location.name).length === 0 && (
                      <p className="no-courts">No active court groups at this location.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="no-locations">No locations found.</p>
        )}
      </div>

      <div className="court-groups-section">
        <h2>Court Groups</h2>
        {courtGroups.length > 0 ? (
          <div className="court-groups-list">
            {courtGroups.map(courtGroup => (
              <div key={courtGroup.id} className="court-group-card">
                <h3>{courtGroup.group_name}</h3>
                {courtGroup.location && (
                  <p className="group-location">
                    <strong>Location:</strong> {courtGroup.location.name}
                  </p>
                )}
                {courtGroup.court_numbers && courtGroup.court_numbers.length > 0 && (
                  <p className="court-numbers">
                    <strong>Courts:</strong> {courtGroup.court_numbers.join(', ')}
                  </p>
                )}
                {courtGroup.preferred_time && (
                  <p className="preferred-time">
                    <strong>Preferred Time:</strong> {courtGroup.preferred_time}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="no-court-groups">No active court groups found.</p>
        )}
      </div>

      <div className="court-info-help">
        <h2>Using This Page</h2>
        <ul>
          <li>Click on the ▶/▼ button to expand/collapse location details</li>
          <li>View all available courts organized by location and group</li>
          <li>Check preferred times for each court group</li>
          <li>Find contact information for each facility</li>
        </ul>
      </div>
    </div>
  );
};
