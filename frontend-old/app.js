// Utility to format time
function timeSince(dateStr) {
    const date = new Date(dateStr);
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return Math.floor(seconds) + "s ago";
}

let loadedLeadIds = new Set();
const colCards = {
    'New': document.querySelector('#col-new .col-cards'),
    'Qualified': document.querySelector('#col-qualified .col-cards'),
    'Contacted': document.querySelector('#col-contacted .col-cards'),
    'Closed': document.querySelector('#col-closed .col-cards')
};
const colCounts = {
    'New': document.querySelector('#count-new'),
    'Qualified': document.querySelector('#count-qualified'),
    'Contacted': document.querySelector('#count-contacted'),
    'Closed': document.querySelector('#count-closed')
};

async function fetchLeads() {
    try {
        const response = await fetch('/api/leads');
        const leads = await response.json();
        
        let counts = { 'New': 0, 'Qualified': 0, 'Contacted': 0, 'Closed': 0 };

        leads.forEach(lead => {
            const status = lead.status || 'Qualified';
            counts[status] = (counts[status] || 0) + 1;

            if (!loadedLeadIds.has(lead._id)) {
                renderLeadCard(lead, status);
                loadedLeadIds.add(lead._id);
            }
        });

        // Update counts
        for (const [key, val] of Object.entries(counts)) {
            if (colCounts[key]) colCounts[key].innerText = val;
        }

    } catch (error) {
        console.error("Error fetching leads:", error);
    }
}

function renderLeadCard(lead, status) {
    const template = document.getElementById('card-template').content.cloneNode(true);
    const card = template.querySelector('.lead-card');
    
    card.setAttribute('data-id', lead._id);
    template.querySelector('.phone-number').innerText = lead.phoneId;
    template.querySelector('.time-ago').innerText = timeSince(lead.createdAt);
    template.querySelector('.location-txt').innerText = lead.location || 'N/A';
    template.querySelector('.budget-txt').innerText = "\u20B9" + (lead.budget || 'N/A');
    template.querySelector('.type-txt').innerText = lead.propertyType || 'N/A';
    
    // Add WhatsApp click to open web wa
    template.querySelector('.btn-action').addEventListener('click', () => {
        window.open(`https://wa.me/${lead.phoneId.replace(/\D/g,'')}?text=Hi, I am calling from 11za Real Estate.`, '_blank');
    });

    const targetCol = colCards[status] || colCards['Qualified'];
    targetCol.appendChild(card);
}

// Event Listeners
document.getElementById('refreshBtn').addEventListener('click', () => {
    // Manually clearing to show refresh animation
    Object.values(colCards).forEach(col => col.innerHTML = '');
    loadedLeadIds.clear();
    fetchLeads();
});

// Drag and drop setup
const containers = document.querySelectorAll('.col-cards');
// Simple drag and drop logic will be added here to change lead status in future updates

// Initial Fetch
fetchLeads();
// Poll every 5 seconds
setInterval(fetchLeads, 5000);
