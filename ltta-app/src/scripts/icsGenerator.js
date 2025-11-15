/**
 * ICS Calendar File Generator for Tennis League Matches
 * Generates RFC 5545 compliant iCalendar files with improved error handling
 */

/**
 * Validates date and time strings
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @param {string} timeStr - Time string in HH:MM format
 * @returns {boolean} - True if valid
 */
const validateDateTime = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) {
    console.warn('Missing date or time parameter');
    return false;
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const timeRegex = /^\d{2}:\d{2}$/;

  if (!dateRegex.test(dateStr)) {
    console.warn(`Invalid date format: ${dateStr}. Expected YYYY-MM-DD`);
    return false;
  }

  if (!timeRegex.test(timeStr)) {
    console.warn(`Invalid time format: ${timeStr}. Expected HH:MM`);
    return false;
  }

  return true;
};

/**
 * Formats a date for ICS format (YYYYMMDDTHHMMSSZ)
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @param {string} timeStr - Time string in HH:MM format
 * @returns {string} - ICS formatted datetime or empty string if invalid
 */
const formatICSDateTime = (dateStr, timeStr) => {
  if (!validateDateTime(dateStr, timeStr)) return '';
  
  try {
    const [year, month, day] = dateStr.split('-');
    const [hour, minute] = timeStr.split(':');
    
    // Create date object and convert to UTC
    const date = new Date(year, month - 1, day, hour, minute);
    
    // Validate the created date
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date created from: ${dateStr} ${timeStr}`);
      return '';
    }
    
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  } catch (error) {
    console.error('Error formatting ICS datetime:', error);
    return '';
  }
};

/**
 * Escapes special characters for ICS format
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
const escapeICSText = (text) => {
  if (!text) return '';
  
  try {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '');
  } catch (error) {
    console.error('Error escaping ICS text:', error);
    return '';
  }
};

/**
 * Generates a unique ID for calendar events
 * @param {string} teamId - Team ID
 * @param {number} week - Week number
 * @returns {string} - Unique event ID
 */
const generateEventId = (teamId, week) => {
  if (!teamId || !week) {
    console.warn('Invalid parameters for event ID generation');
    return `match-unknown-week${week || 'unknown'}-${Date.now()}@couleeregiontennis.com`;
  }
  
  return `match-${teamId}-week${week}-${Date.now()}@couleeregiontennis.com`;
};

/**
 * Calculates end time (adds 3 hours to start time for tennis matches)
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @param {string} timeStr - Time string in HH:MM format
 * @returns {string} - ICS formatted end datetime or empty string if invalid
 */
const calculateEndTime = (dateStr, timeStr) => {
  if (!validateDateTime(dateStr, timeStr)) return '';
  
  try {
    const [year, month, day] = dateStr.split('-');
    const [hour, minute] = timeStr.split(':');
    
    const startDate = new Date(year, month - 1, day, hour, minute);
    
    // Validate start date
    if (isNaN(startDate.getTime())) {
      console.warn(`Invalid start date for end time calculation: ${dateStr} ${timeStr}`);
      return '';
    }
    
    const endDate = new Date(startDate.getTime() + (3 * 60 * 60 * 1000)); // Add 3 hours
    
    return endDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  } catch (error) {
    console.error('Error calculating end time:', error);
    return '';
  }
};

/**
 * Formats roster for display in event description
 * @param {Array} roster - Array of player objects
 * @returns {string} - Formatted roster string
 */
const formatRoster = (roster) => {
  if (!roster || !Array.isArray(roster) || roster.length === 0) {
    return 'Roster not available';
  }
  
  try {
    return roster
      .map(player => {
        if (!player || !player.first_name || !player.last_name) {
          return 'Unknown Player';
        }
        const name = `${player.first_name} ${player.last_name}`;
        return player.is_captain ? `${name} (Captain)` : name;
      })
      .join(', ');
  } catch (error) {
    console.error('Error formatting roster:', error);
    return 'Roster formatting error';
  }
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
  // Validate required parameters
  if (!match || !teamName) {
    console.error('Invalid match or team name provided to generateICSEvent');
    return '';
  }

  try {
    const isHome = match.home_team_number === parseInt(match.current_team_id);
    const opponentName = isHome ? match.away_team_name : match.home_team_name;
    const location = match.courts ? `Courts: ${match.courts}` : 'TBD';
    
    const startTime = formatICSDateTime(match.date, match.time);
    const endTime = calculateEndTime(match.date, match.time);
    
    if (!startTime || !endTime) {
      console.warn(`Invalid date/time for match: ${match.date} ${match.time}`);
      return '';
    }
    
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
  } catch (error) {
    console.error('Error generating ICS event:', error);
    return '';
  }
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
  // Validate inputs
  if (!matches || !Array.isArray(matches)) {
    console.error('Invalid matches array provided to generateFullSeasonICS');
    return '';
  }
  
  if (!teamName || typeof teamName !== 'string') {
    console.error('Invalid team name provided to generateFullSeasonICS');
    return '';
  }

  try {
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
    }).filter(event => event); // Filter out empty events

    const icsFooter = 'END:VCALENDAR';

    return [icsHeader, ...events, icsFooter].join('\r\n');
  } catch (error) {
    console.error('Error generating full season ICS:', error);
    return '';
  }
};

/**
 * Triggers download of ICS file
 * @param {string} icsContent - ICS file content
 * @param {string} filename - Filename for download
 */
export const downloadICSFile = (icsContent, filename = 'tennis-schedule.ics') => {
  if (!icsContent || typeof icsContent !== 'string') {
    console.error('Invalid ICS content provided for download');
    return;
  }

  try {
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
    console.log(`ICS file downloaded: ${filename}`);
  } catch (error) {
    console.error('Error downloading ICS file:', error);
  }
};
