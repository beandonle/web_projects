document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector("form").onsubmit = send_email;

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      // Print emails
      console.log(emails);

      emails.forEach(email => show_email(email, mailbox));
  });
}

function send_email() {
  const recipients = document.querySelector("#compose-recipients").value;
  const subject = document.querySelector("#compose-subject").value;
  const body = document.querySelector("#compose-body").value;
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
  .then(result => {
      // Print result
      console.log(result);
  });
  localStorage.clear();
  load_mailbox('sent');
  return false;
}

function show_email(email, mailbox) {
  const emailDiv = document.createElement("div");
  emailDiv.id = "email";

  const header = document.createElement("div");
  header.id = "header"
  header.className = "card-header"

  const headerLine = document.createElement('div');
  headerLine.id = "header-line";
  headerLine.className = "d-flex justify-content-between"

  const recipient = document.createElement("div")
  recipient.id = "email-sender";
  recipient.className = "d-inline-block align-items-left";
  console.log(`Mailbox atual: ${mailbox}`);
  if (mailbox === "inbox") {
    recipient.innerHTML = email.sender;
  }
  else {
    recipient.innerHTML = email.recipients[0];
  }
  headerLine.appendChild(recipient);

  const cardBody = document.createElement("div");
  cardBody.id = "card-body";
  cardBody.className="card-body";

  const subject = document.createElement("div");
  subject.id = "email-subject";
  subject.className = "card-text";
  subject.innerHTML = email.subject;
  cardBody.appendChild(subject);

  console.log(mailbox);
  if (mailbox !== "sent") {
    const button = document.createElement("btn");
    button.id = "archive-btn";
    if (mailbox === 'archive') {
      button.innerHTML = "Unarchive"
    }
    else {
      button.innerHTML = "Archive";
    }
    button.className = "btn btn-outline-success d-inline-block mr-4";
    headerLine.appendChild(button);
    button.addEventListener("click", () => archive_email(email.id, email.archived) );
  }

  header.appendChild(headerLine);
  emailDiv.appendChild(header);
  emailDiv.appendChild(cardBody);

  if (email.read === true) {
    emailDiv.className = "card read";
  }
  else {
    emailDiv.className = "card";
  }
  const timestamp = document.createElement("div");
  timestamp.id = "email-timestamp";
  timestamp.className = "card-footer text-muted";
  timestamp.innerHTML = email.timestamp;
  emailDiv.appendChild(timestamp);

  recipient.addEventListener("click", () => view_email(email.id));
  subject.addEventListener("click", () => view_email(email.id));
  timestamp.addEventListener("click", () => view_email(email.id));
  document.querySelector("#emails-view").append(emailDiv);
}

function archive_email(email_id, previous) {
  const current = !previous;
  console.log(`updating email as archived = ${current}`);
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
        archived: current
    })
  })
  load_mailbox('inbox');
  window.location.reload();
}

function view_email(email_id) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
      mark_read(email_id);
      // Print email
      console.log(email); 

      document.querySelector('#email-view-sender').innerHTML = email.sender;
      document.querySelector('#email-view-recipients').innerHTML = email.recipients;
      document.querySelector('#email-view-subject').innerHTML = email.subject;
      document.querySelector('#email-view-timestamp').innerHTML = email.timestamp;
      document.querySelector('#email-view-body').innerHTML = email.body;
      document.getElementById('reply-email-button').addEventListener('click', () => {
        reply_email(email)
      });
  });
  return false;
}

function reply_email(email) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  document.querySelector('#compose-recipients').value = email.sender;
  if (email.subject.indexOf("Re: ") === -1) {
    email.subject = "Re: " + email.subject;
  }
  document.querySelector("#compose-subject").value = email.subject;
  document.querySelector('#compose-body').value = `\n\nOn ${email.timestamp} ${email.sender} wrote:\n \n${email.body}`;
}

function mark_read(email_id) {
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  })
}