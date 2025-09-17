/**
 * ICS Calendar File Generator for Tennis League Matches
 * Generates RFC 5545 compliant iCalendar files
 */

/**
 * Formats a date for ICS format (YYYYMMDDTHHMMSSZ)
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @param {string} timeStr - Time string in HH:MM format
 * @returns {string} - ICS formatted datetime
 */
const formatICSDateTime = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return '';
  
  const [year, month, day] = dateStr.split('-');
  const [hour, minute] = timeStr.split(':');
  
  // Create date object and convert to UTC
  const date = new Date(year, month - 1, day, hour, minute);
  
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
};

/**
 * Escapes special characters for ICS format
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
const escapeICSText = (text) => {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
};

/**
 * Generates a unique ID for calendar events
 * @param {string} teamId - Team ID
 * @param {number} week - Week number
 * @returns {string} - Unique event ID
 */
const generateEventId = (teamId, week) => {
  return `match-${teamId}-week${week}-${Date.now()}@couleeregiontennis.com`;
};

/**
 * Calculates end time (adds 3 hours to start time for tennis matches)
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @param {string} timeStr - Time string in HH:MM format
 * @returns {string} - ICS formatted end datetime
 */
const calculateEndTime = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return '';
  
  const [year, month, day] = dateStr.split('-');
  const [hour, minute] = timeStr.split(':');
  
  const startDate = new Date(year, month - 1, day, hour, minute);
  const endDate = new Date(startDate.getTime() + (3 * 60 * 60 * 1000)); // Add 3 hours
  
  return endDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
};

/**
 * Formats roster for display in event description
 * @param {Array} roster - Array of player objects
 * @returns {string} - Formatted roster string
 */
const formatRoster = (roster) => {
  if (!roster || roster.length === 0) return 'Roster not available';
  
  return roster
    .map(player => {
      const name = `${player.first_name} ${player.last_name}`;
      return player.is_captain ? `${name} (Captain)` : name;
    })
    .join(', ');
};

/**
 * Generates a single ICS event for a tennis match
 * @param {Object} match - Match data
 * @param {string} teamName - Current team name
 * @param {Array} teamRoster - Current team roster
 * @param {Array} opponentRoster - Opponent team roster
 * @returns {string} - ICS event string
 */
const generateICSEvent = (match, teamName, teamRoster, opponentRoster) => {
  const isHome = match.home_team_number === parseInt(match.current_team_id);
  const opponentName = isHome ? match.away_team_name : match.home_team_name;
  const location = match.courts ? `Courts: ${match.courts}` : 'TBD';
  
  const startTime = formatICSDateTime(match.date, match.time);
  const endTime = calculateEndTime(match.date, match.time);
  const eventId = generateEventId(match.current_team_id, match.week);
  
  const summary = `${teamName} vs ${opponentName}`;
  const description = [
    `Tennis Match: ${teamName} vs ${opponentName}`,
    `Week ${match.week}`,
    `Courts: ${match.courts || 'TBD'}`,
    '',
    `${teamName} Roster:`,
    formatRoster(teamRoster),
    '',
    `${opponentName} Roster:`,
    formatRoster(opponentRoster),
    '',
    'Good luck and have fun!'
  ].join('\\n');

  return [
    'BEGIN:VEVENT',
    `UID:${eventId}`,
    `DTSTART:${startTime}`,
    `DTEND:${endTime}`,
    `SUMMARY:${escapeICSText(summary)}`,
    `DESCRIPTION:${escapeICSText(description)}`,
    `LOCATION:${escapeICSText(location)}`,
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
    'END:VEVENT'
  ].join('\r\n');
};

/**
 * Generates a complete ICS file for all team matches
 * @param {Array} matches - Array of match objects
 * @param {string} teamName - Team name
 * @param {Array} teamRoster - Team roster
 * @param {Object} opponentRosters - Object mapping opponent team IDs to rosters
 * @returns {string} - Complete ICS file content
 */
export const generateFullSeasonICS = (matches, teamName, teamRoster, opponentRosters = {}) => {
  const icsHeader = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Coulee Region Tennis League//Tennis Schedule//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeICSText(teamName)} - Full Season`,
    'X-WR-CALDESC:Complete tennis match schedule with opponent rosters',
    'X-WR-TIMEZONE:America/Chicago'
  ].join('\r\n');

  const events = matches.map(match => {
    const isHome = match.home_team_number === parseInt(match.current_team_id);
    const opponentTeamId = isHome ? match.away_team_number : match.home_team_number;
    const opponentRoster = opponentRosters[opponentTeamId] || [];
    
    return generateICSEvent(match, teamName, teamRoster, opponentRoster);
  }).join('\r\n');

  const icsFooter = 'END:VCALENDAR';

  return [icsHeader, events, icsFooter].join('\r\n');
};

/**
 * Triggers download of ICS file
 * @param {string} icsContent - ICS file content
 * @param {string} filename - Filename for download
 */
export const downloadICSFile = (icsContent, filename = 'tennis-schedule.ics') => {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  window.URL.revokeObjectURL(url);
};
