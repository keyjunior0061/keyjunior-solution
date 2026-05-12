# KeyJunior Solution Website

One-page professional website for KeyJunior Solution.

## Services

- Web development
- Mobile app development
- Graphic design
- Computer maintenance

## Contact

- WhatsApp: 0763367139
- Instagram: keyjunior0061
- Email: keyjunior0061@gmail.com

## Files

- `index.html`
- `styles.css`
- `script.js`
- `server.js`
- `submissions.json`
- `analytics.json`
- `comments.json`
- `admin.html`

## Run Backend

Node.js is installed locally in `.tools`.

## Email Setup

Copy `.env.example` to `.env`, then put your Gmail app password:

```text
EMAIL_USER=keyjunior0061@gmail.com
EMAIL_APP_PASSWORD=your_gmail_app_password_here
EMAIL_TO=keyjunior0061@gmail.com
PORT=3000
```

Use a Gmail App Password, not your normal Gmail password.

On Windows, double-click:

```text
start-backend.bat
```

Or run:

```powershell
.\start-backend.ps1
```

If Node.js is installed globally, you can also run:

```bash
npm start
```

Open:

```text
http://localhost:3000
```

Contact form submissions are saved in `submissions.json`.

## Dashboard

Open the admin dashboard here after starting the backend:

```text
http://localhost:3000/admin.html
```

It shows:

- Total website views
- Contact messages count
- Visitor comments
- Recent contact messages

Views are saved in `analytics.json`, and comments are saved in `comments.json`.
