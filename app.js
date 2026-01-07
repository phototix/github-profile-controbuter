document.getElementById('githubForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    
    if (username) {
        fetchGitHubData(username);
    }
});

function fetchGitHubData(username) {
    // Show loading spinner
    document.getElementById('loading').style.display = 'block';
    document.getElementById('errorMessage').style.display = 'none';
    document.getElementById('resultsSection').style.display = 'none';
    
    // Fetch user data from GitHub API
    fetch(`https://api.github.com/users/${username}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('User not found or API rate limit exceeded');
            }
            return response.json();
        })
        .then(userData => {
            // Display user info
            displayUserInfo(userData);
            
            // For demonstration, we'll generate mock contribution data
            // In a real implementation, you would fetch actual contribution data
            // Note: GitHub doesn't have a public API for contribution graphs
            // So we're simulating the data for this demo
            const contributionsData = generateMockContributions();
            displayContributions(contributionsData);
            
            // Show results
            document.getElementById('loading').style.display = 'none';
            document.getElementById('resultsSection').style.display = 'block';
        })
        .catch(error => {
            document.getElementById('loading').style.display = 'none';
            const errorMessage = document.getElementById('errorMessage');
            errorMessage.textContent = `Error: ${error.message}. Please check the username and try again.`;
            errorMessage.style.display = 'block';
        });
}

function displayUserInfo(user) {
    const userInfoDiv = document.getElementById('userInfo');
    
    userInfoDiv.innerHTML = `
        <img src="${user.avatar_url}" alt="${user.login}" class="avatar">
        <div class="user-details">
            <h2 class="user-name">${user.name || user.login}</h2>
            <p class="user-login">@${user.login}</p>
            <p class="user-bio">${user.bio || 'No bio available'}</p>
            <div class="user-stats">
                <div class="stat">
                    <div class="stat-value">${user.public_repos}</div>
                    <div class="stat-label">Public Repos</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${user.followers}</div>
                    <div class="stat-label">Followers</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${user.following}</div>
                    <div class="stat-label">Following</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${user.public_gists || 0}</div>
                    <div class="stat-label">Gists</div>
                </div>
            </div>
        </div>
    `;
}

function generateMockContributions() {
    // Generate mock contribution data for the past year
    const contributions = [];
    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    
    let currentDate = new Date(oneYearAgo);
    let totalContributions = 0;
    
    while (currentDate <= today) {
        // Generate random contribution count (0-15)
        // More likely to have 0-2 contributions, less likely to have many
        let count;
        const rand = Math.random();
        
        if (rand < 0.5) count = 0;
        else if (rand < 0.7) count = 1;
        else if (rand < 0.85) count = 2;
        else if (rand < 0.93) count = 3;
        else if (rand < 0.97) count = 4;
        else count = Math.floor(Math.random() * 11) + 5; // 5-15
        
        contributions.push({
            date: currentDate.toISOString().split('T')[0],
            count: count
        });
        
        totalContributions += count;
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return {
        contributions: contributions,
        total: totalContributions
    };
}

function displayContributions(data) {
    const calendarGrid = document.getElementById('calendarGrid');
    calendarGrid.innerHTML = '';
    
    // Contribution color scale (similar to GitHub's)
    const colorScale = [
        '#161b22', // 0 contributions
        '#0e4429', // 1-2 contributions
        '#006d32', // 3-4 contributions
        '#26a641', // 5-6 contributions
        '#39d353'  // 7+ contributions
    ];
    
    // Calculate streaks and statistics
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    // Find the first Sunday before or on the first contribution date
    const firstDate = new Date(data.contributions[0].date);
    const firstDayOfWeek = firstDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Create a map of dates to contributions for easy lookup
    const contributionMap = new Map();
    data.contributions.forEach(day => {
        contributionMap.set(day.date, day.count);
        
        // Calculate streaks
        if (day.count > 0) {
            tempStreak++;
            currentStreak = Math.max(currentStreak, tempStreak);
        } else {
            longestStreak = Math.max(longestStreak, tempStreak);
            tempStreak = 0;
        }
    });
    
    // Calculate number of weeks to display
    const lastDate = new Date(data.contributions[data.contributions.length - 1].date);
    const totalDays = Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24)) + 1;
    const totalWeeks = Math.ceil((totalDays + firstDayOfWeek) / 7);
    
    // Create columns for each week
    for (let week = 0; week < totalWeeks; week++) {
        const weekColumn = document.createElement('div');
        weekColumn.className = 'calendar-week';
        
        // Create 7 days (rows) for each week
        for (let day = 0; day < 7; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            
            // Calculate the actual date for this cell
            const cellDate = new Date(firstDate);
            cellDate.setDate(firstDate.getDate() - firstDayOfWeek + (week * 7) + day);
            const cellDateStr = cellDate.toISOString().split('T')[0];
            
            // Check if this date is in our contribution range
            if (contributionMap.has(cellDateStr)) {
                const count = contributionMap.get(cellDateStr);
                
                // Determine color based on contribution count
                let colorIndex;
                if (count === 0) colorIndex = 0;
                else if (count <= 2) colorIndex = 1;
                else if (count <= 4) colorIndex = 2;
                else if (count <= 6) colorIndex = 3;
                else colorIndex = 4;
                
                dayElement.style.backgroundColor = colorScale[colorIndex];
                dayElement.setAttribute('data-count', count);
                dayElement.setAttribute('data-date', cellDateStr);
            } else {
                // Empty cell (outside date range)
                dayElement.style.backgroundColor = 'transparent';
                dayElement.style.border = 'none';
            }
            
            weekColumn.appendChild(dayElement);
        }
        
        calendarGrid.appendChild(weekColumn);
    }
    
    // Update longest streak one more time in case the last day had contributions
    longestStreak = Math.max(longestStreak, tempStreak);
    
    // Calculate current streak (consecutive days with contributions up to today)
    let currentTempStreak = 0;
    const today = new Date().toISOString().split('T')[0];
    
    // Check backwards from today
    for (let i = data.contributions.length - 1; i >= 0; i--) {
        if (data.contributions[i].count > 0 && data.contributions[i].date <= today) {
            currentTempStreak++;
        } else {
            break;
        }
    }
    
    // Update summary statistics
    document.getElementById('totalContributions').textContent = data.total;
    document.getElementById('currentStreak').textContent = currentTempStreak;
    document.getElementById('longestStreak').textContent = longestStreak;
    
    // Calculate daily average (contributions per day over the year)
    const daysCount = data.contributions.length;
    const dailyAverage = (data.total / daysCount).toFixed(1);
    document.getElementById('dailyAverage').textContent = dailyAverage;
}

// Load sample data on page load
window.addEventListener('DOMContentLoaded', function() {
    fetchGitHubData('phototix');
});