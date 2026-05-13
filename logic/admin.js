const totalViews = document.querySelector("[data-total-views]");
const totalContacts = document.querySelector("[data-total-contacts]");
const totalComments = document.querySelector("[data-total-comments]");
const lastView = document.querySelector("[data-last-view]");
const contactCount = document.querySelector("[data-contact-count]");
const commentCount = document.querySelector("[data-comment-count]");
const contactList = document.querySelector("[data-contact-list]");
const commentList = document.querySelector("[data-comment-list]");

function formatDate(value) {
  if (!value) return "Never";
  return new Date(value).toLocaleString();
}

function emptyMessage(message) {
  return `<p class="admin-empty">${message}</p>`;
}

function renderContacts(contacts) {
  if (!contacts.length) {
    contactList.innerHTML = emptyMessage("No contact messages yet.");
    return;
  }

  contactList.innerHTML = contacts
    .map(
      (contact) => `
        <div class="admin-item">
          <strong>${contact.name}</strong>
          <span>${contact.service} | ${contact.email}</span>
          <p>${contact.message}</p>
          <small>${formatDate(contact.createdAt)}</small>
        </div>
      `
    )
    .join("");
}

function renderComments(comments) {
  if (!comments.length) {
    commentList.innerHTML = emptyMessage("No comments yet.");
    return;
  }

  commentList.innerHTML = comments
    .map(
      (comment) => `
        <div class="admin-item">
          <strong>${comment.name}</strong>
          <p>${comment.message}</p>
          <small>${formatDate(comment.createdAt)}</small>
        </div>
      `
    )
    .join("");
}

async function loadDashboard() {
  const response = await fetch("/api/dashboard");
  const data = await response.json();

  totalViews.textContent = data.counts.views;
  totalContacts.textContent = data.counts.contacts;
  totalComments.textContent = data.counts.comments;
  lastView.textContent = formatDate(data.analytics.lastViewedAt);
  contactCount.textContent = `${data.counts.contacts} messages`;
  commentCount.textContent = `${data.counts.comments} comments`;

  renderContacts(data.recentContacts);
  renderComments(data.recentComments);
}

loadDashboard().catch(() => {
  contactList.innerHTML = emptyMessage("Backend is not running. Start it first.");
  commentList.innerHTML = emptyMessage("Backend is not running. Start it first.");
});
