const { describe, it, expect, beforeEach } = require('@jest/globals');
const seedrandom = require('seedrandom');

// Import the functions from the script to test
// We need to extract them for testing purposes
const shuffle = (items, seed) => {
    const rng = seedrandom(seed);
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
};

const generateRoundRobin = (teams, seed = 2025) => {
    if (teams.length < 2) return [];

    const rotated = shuffle(teams, seed);
    if (rotated.length % 2 === 1) rotated.push(null);

    const rounds = rotated.length - 1;
    const half = rotated.length / 2;
    const schedule = [];

    for (let round = 0; round < rounds; round++) {
        const matches = [];
        for (let i = 0; i < half; i++) {
            const home = rotated[i];
            const away = rotated[rotated.length - 1 - i];
            if (home && away) {
                matches.push({ home, away });
            }
        }
        schedule.push(matches);

        const fixed = rotated[0];
        const rest = rotated.slice(1);
        rest.unshift(rest.pop());
        rotated.splice(0, rotated.length, fixed, ...rest);
    }

    return schedule;
};

const assignSlots = (matchesByWeek) => {
    const COURT_GROUPS = ['Courts 1–5', 'Courts 6–9', 'Courts 10–13'];
    const TIMES = ['5:30pm', '7:00pm'];

    const slots = COURT_GROUPS.flatMap((court) =>
        TIMES.map((time) => ({ court, time }))
    );

    // Track team court and time usage for better distribution
    const teamCourtUsage = {};
    const teamTimeUsage = {};

    return matchesByWeek.map((matches, weekIdx) => {
        if (matches.length > slots.length) {
            throw new Error(
                `Week ${weekIdx + 1} requires ${matches.length} slots but only ${slots.length} are configured`
            );
        }

        // For small number of teams, use different court assignment strategy
        const isSmallLeague = matchesByWeek.length <= 2;

        return matches.map((match, matchIdx) => {
            // Find the best slot based on team usage history
            let bestSlot = null;
            let bestScore = Infinity;

            // Try each slot and calculate a "balance score"
            slots.forEach((slot, slotIdx) => {
                const courtUsage = [match.home.id, match.away.id].reduce((total, teamId) => {
                    const usage = teamCourtUsage[teamId]?.[slot.court] || 0;
                    return total + usage;
                }, 0);

                const timeUsage = [match.home.id, match.away.id].reduce((total, teamId) => {
                    const usage = teamTimeUsage[teamId]?.[slot.time] || 0;
                    return total + usage;
                }, 0);

                // For small leagues, prefer slots that haven't been used as much
                // For larger leagues, use alternating pattern with balancing
                const score = isSmallLeague ? courtUsage + timeUsage : courtUsage + timeUsage * 2;

                if (score < bestScore) {
                    bestScore = score;
                    bestSlot = slot;
                }
            });

            // Use the best slot found, or fall back to rotation pattern
            if (!bestSlot) {
                bestSlot = slots[(matchIdx + weekIdx) % slots.length];
            }

            // Update usage tracking
            [match.home.id, match.away.id].forEach(teamId => {
                if (!teamCourtUsage[teamId]) teamCourtUsage[teamId] = {};
                if (!teamTimeUsage[teamId]) teamTimeUsage[teamId] = {};

                teamCourtUsage[teamId][bestSlot.court] = (teamCourtUsage[teamId][bestSlot.court] || 0) + 1;
                teamTimeUsage[teamId][bestSlot.time] = (teamTimeUsage[teamId][bestSlot.time] || 0) + 1;
            });

            return {
                ...match,
                court: bestSlot.court,
                time: bestSlot.time
            };
        });
    });
};

const buildSchedules = (teamsByNight) => {
    const START_DATE_BY_NIGHT = {
        tuesday: '2025-06-03',
        wednesday: '2025-06-04'
    };

    const addDays = (dateStr, days) => {
        const d = new Date(dateStr);
        d.setDate(d.getDate() + days);
        return d.toISOString().slice(0, 10);
    };

    return Object.entries(teamsByNight).map(([night, teams]) => {
        if (teams.length < 2) {
            return {
                night,
                message: 'Not enough teams to build a schedule',
                matches: []
            };
        }

        const baseDate = START_DATE_BY_NIGHT[night];
        if (!baseDate) {
            throw new Error(`Missing start date configuration for night '${night}'`);
        }

        const roundRobin = generateRoundRobin(teams);
        const scheduledRounds = assignSlots(roundRobin);

        const matches = [];
        scheduledRounds.forEach((round, roundIdx) => {
            const date = addDays(baseDate, roundIdx * 7);
            round.forEach(({ home, away, court, time }) => {
                matches.push({
                    play_night: night,
                    week: roundIdx + 1,
                    date,
                    time,
                    court,
                    home_team_id: home.id,
                    home_team_number: home.number,
                    home_team_name: home.name,
                    away_team_id: away.id,
                    away_team_number: away.number,
                    away_team_name: away.name
                });
            });
        });

        return {
            night,
            start_date: baseDate,
            team_count: teams.length,
            matches
        };
    });
};

describe('Round Robin Schedule Generator', () => {
    let mockTeams;

    beforeEach(() => {
        // Create mock teams for testing
        mockTeams = [
            { id: 1, number: '1', name: 'Team A', play_night: 'tuesday' },
            { id: 2, number: '2', name: 'Team B', play_night: 'tuesday' },
            { id: 3, number: '3', name: 'Team C', play_night: 'tuesday' },
            { id: 4, number: '4', name: 'Team D', play_night: 'tuesday' },
            { id: 5, number: '5', name: 'Team E', play_night: 'tuesday' },
            { id: 6, number: '6', name: 'Team F', play_night: 'tuesday' }
        ];
    });

    describe('Team plays once per week', () => {
        it('should ensure each team plays exactly one match per week', () => {
            const teamsByNight = { tuesday: mockTeams };
            const schedules = buildSchedules(teamsByNight);
            const tuesdaySchedule = schedules.find(s => s.night === 'tuesday');

            // Group matches by week
            const matchesByWeek = {};
            tuesdaySchedule.matches.forEach(match => {
                if (!matchesByWeek[match.week]) {
                    matchesByWeek[match.week] = [];
                }
                matchesByWeek[match.week].push(match);
            });

            // Check each week
            Object.entries(matchesByWeek).forEach(([week, weekMatches]) => {
                const teamAppearances = new Set();

                weekMatches.forEach(match => {
                    teamAppearances.add(match.home_team_id);
                    teamAppearances.add(match.away_team_id);
                });

                expect(teamAppearances.size).toBe(mockTeams.length);

                // Verify each team appears exactly once
                mockTeams.forEach(team => {
                    const appearances = weekMatches.filter(m =>
                        m.home_team_id === team.id || m.away_team_id === team.id
                    ).length;
                    expect(appearances).toBe(1);
                });
            });
        });
    });

    describe('Each team plays every other team exactly once', () => {
        it('should ensure every team plays every other team exactly once', () => {
            const teamsByNight = { tuesday: mockTeams };
            const schedules = buildSchedules(teamsByNight);
            const tuesdaySchedule = schedules.find(s => s.night === 'tuesday');

            // Track all matchups
            const matchups = new Set();

            tuesdaySchedule.matches.forEach(match => {
                const matchupKey = [match.home_team_id, match.away_team_id].sort().join('-');
                matchups.add(matchupKey);
            });

            // Calculate expected number of unique matchups
            const expectedMatchups = (mockTeams.length * (mockTeams.length - 1)) / 2;

            expect(matchups.size).toBe(expectedMatchups);

            // Verify every possible pair exists
            for (let i = 0; i < mockTeams.length; i++) {
                for (let j = i + 1; j < mockTeams.length; j++) {
                    const matchupKey = [mockTeams[i].id, mockTeams[j].id].sort().join('-');
                    expect(matchups.has(matchupKey)).toBe(true);
                }
            }
        });
    });

    describe('Court group rotation', () => {
        it('should rotate teams through different court groups as much as possible', () => {
            const teamsByNight = { tuesday: mockTeams };
            const schedules = buildSchedules(teamsByNight);
            const tuesdaySchedule = schedules.find(s => s.night === 'tuesday');

            // Track court assignments for each team
            const teamCourtAssignments = {};
            mockTeams.forEach(team => {
                teamCourtAssignments[team.id] = {};
            });

            tuesdaySchedule.matches.forEach(match => {
                [match.home_team_id, match.away_team_id].forEach(teamId => {
                    if (!teamCourtAssignments[teamId][match.court]) {
                        teamCourtAssignments[teamId][match.court] = 0;
                    }
                    teamCourtAssignments[teamId][match.court]++;
                });
            });

            // Verify teams play at different courts
            mockTeams.forEach(team => {
                const courtsPlayed = Object.keys(teamCourtAssignments[team.id]);

                // Teams should play at multiple different courts if possible
                if (mockTeams.length > 2) {
                    expect(courtsPlayed.length).toBeGreaterThan(1);
                }

                // Count total matches for this team
                const totalMatches = Object.values(teamCourtAssignments[team.id]).reduce((a, b) => a + b, 0);

                // Verify distribution is somewhat balanced (no court should have more than 60% of matches)
                Object.values(teamCourtAssignments[team.id]).forEach(count => {
                    const ratio = count / totalMatches;
                    expect(ratio).toBeLessThan(0.6);
                });
            });
        });
    });

    describe('Time slot balance', () => {
        it('should ensure teams play a similar amount of early and late matches', () => {
            const teamsByNight = { tuesday: mockTeams };
            const schedules = buildSchedules(teamsByNight);
            const tuesdaySchedule = schedules.find(s => s.night === 'tuesday');

            // Track time assignments for each team
            const teamTimeAssignments = {};
            mockTeams.forEach(team => {
                teamTimeAssignments[team.id] = {
                    '5:30pm': 0,
                    '7:00pm': 0
                };
            });

            tuesdaySchedule.matches.forEach(match => {
                [match.home_team_id, match.away_team_id].forEach(teamId => {
                    teamTimeAssignments[teamId][match.time]++;
                });
            });

            // Verify balance for each team
            mockTeams.forEach(team => {
                const earlyGames = teamTimeAssignments[team.id]['5:30pm'];
                const lateGames = teamTimeAssignments[team.id]['7:00pm'];
                const totalGames = earlyGames + lateGames;

                // For teams with enough games, the difference should not be more than 1
                if (totalGames >= 4) {
                    const difference = Math.abs(earlyGames - lateGames);
                    expect(difference).toBeLessThanOrEqual(1);
                }

                // Verify teams have both time slots represented if they have enough games
                if (totalGames >= 2) {
                    expect(earlyGames).toBeGreaterThan(0);
                    expect(lateGames).toBeGreaterThan(0);
                }
            });
        });
    });

    describe('Edge cases', () => {
        it('should handle odd number of teams correctly', () => {
            const oddTeams = mockTeams.slice(0, 5); // 5 teams
            const teamsByNight = { tuesday: oddTeams };
            const schedules = buildSchedules(teamsByNight);
            const tuesdaySchedule = schedules.find(s => s.night === 'tuesday');

            // With 5 teams, each team should play 4 games (one against each other team)
            oddTeams.forEach(team => {
                const teamMatches = tuesdaySchedule.matches.filter(m =>
                    m.home_team_id === team.id || m.away_team_id === team.id
                );
                expect(teamMatches.length).toBe(4);
            });
        });

        it('should handle insufficient teams gracefully', () => {
            const insufficientTeams = mockTeams.slice(0, 1); // 1 team
            const teamsByNight = { tuesday: insufficientTeams };
            const schedules = buildSchedules(teamsByNight);
            const tuesdaySchedule = schedules.find(s => s.night === 'tuesday');

            expect(tuesdaySchedule.message).toBe('Not enough teams to build a schedule');
            expect(tuesdaySchedule.matches.length).toBe(0);
        });

        it('should handle exactly two teams correctly', () => {
            const twoTeams = mockTeams.slice(0, 2);
            const teamsByNight = { tuesday: twoTeams };
            const schedules = buildSchedules(teamsByNight);
            const tuesdaySchedule = schedules.find(s => s.night === 'tuesday');

            expect(tuesdaySchedule.matches.length).toBe(1);
            // Should be exactly the two teams playing each other, but order may vary due to shuffling
            const match = tuesdaySchedule.matches[0];
            const teamIds = [twoTeams[0].id, twoTeams[1].id].sort();
            const matchTeamIds = [match.home_team_id, match.away_team_id].sort();

            expect(matchTeamIds).toEqual(teamIds);
        });
    });
});
