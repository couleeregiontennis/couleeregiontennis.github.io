import { useState, useEffect } from 'react';
import { supabase } from '../scripts/supabaseClient';
import '../styles/CourtsLocations.css';

const facilitySpotlights = [
  {
    title: 'Green Island Courts',
    address: '2312 7th St S, La Crosse, WI 54601',
    description: 'Primary LTTA venue with 13 outdoor courts, refreshed lighting on Courts 1-7, and year-round programming.',
    map: 'https://www.google.com/maps/place/2312+7th+St+S,+La+Crosse,+WI+54601/'
  },
  {
    title: 'Central High School Courts',
    address: '1801 Losey Blvd S, La Crosse, WI 54601',
    description: 'Backup site captains can reserve through Parks & Rec when overflow scheduling is required.',
    map: 'https://www.google.com/maps/place/1801+Losey+Blvd+S,+La+Crosse,+WI+54601/'
  }
];

const courtCheatSheet = [
  {
    title: 'Courts 1 – 5',
    body: 'One standalone court near the ice arena plus four adjacent courts—great for alternating singles and doubles lines.'
  },
  {
    title: 'Courts 6 – 9',
    body: 'Central bank used for Lines #1–#5 on peak nights. Includes shaded seating for captains and subs.'
  },
  {
    title: 'Courts 10 – 13',
    body: 'Western-most stretch that stays shaded longer—perfect for late-afternoon drills or overflow matches.'
  }
];

const courtBreakdown = [
  { court: 'Court 6', usage: '#1/#2 Doubles (or Line 1 singles if agreed)' },
  { court: 'Court 7', usage: '#3 Doubles' },
  { court: 'Court 8', usage: '#3 Doubles' },
  { court: 'Court 9', usage: '#4/#5 Doubles' }
];

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

      <section className="card card--interactive supplemental-section">
        <div className="section-header compact">
          <div>
            <h2>Featured Facilities</h2>
            <p>Quick reference for captains coordinating subs or visiting teams.</p>
          </div>
        </div>
        <div className="facility-grid">
          {facilitySpotlights.map((facility) => (
            <article className="facility-card" key={facility.title}>
              <h3>{facility.title}</h3>
              <p className="facility-address">{facility.address}</p>
              <p>{facility.description}</p>
              <a href={facility.map} target="_blank" rel="noreferrer" className="btn-link">
                Open in Google Maps
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="card card--interactive supplemental-section">
        <div className="section-header compact">
          <div>
            <h2>Court Assignment Cheat Sheet</h2>
            <p>Use these pairings when confirming courts with opposing captains.</p>
          </div>
        </div>
        <div className="assignment-grid">
          {courtCheatSheet.map((assignment) => (
            <article className="assignment-card" key={assignment.title}>
              <h3>{assignment.title}</h3>
              <p>{assignment.body}</p>
            </article>
          ))}
        </div>
        <div className="detail-card">
          <h3>Courts 6–9 Breakdown</h3>
          <ul>
            {courtBreakdown.map((row) => (
              <li key={row.court}>
                <span className="court-label">{row.court}</span>
                <span className="court-usage">{row.usage}</span>
              </li>
            ))}
          </ul>
          <p className="detail-note">Confirm any deviations with the opposing captain before match night.</p>
        </div>
      </section>
    </div>
  );
};
