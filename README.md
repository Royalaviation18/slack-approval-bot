
# Slack Approval Bot

 📌 Overview

This is a Slack Approval Bot developed using Node.js, Express, and the Slack API. The bot enables a user (Requester) to request approval from another user (Approver) through a Slack modal. The Approver can either approve or reject the request, and the Requester will be notified of the decision.




## 🚀 Features

- Slash Command (/approval-test): Opens a modal for approval request.

- User Dropdown: Select an approver from Slack members.

- Approval Text Input: Enter details for the approval request.

- Approval Notification: Sends a message to the selected approver  with Approve/Reject buttons.

- Requester Notification: Requester gets notified when the approver makes a decision.

- Slack Event Subscription: Handles Slack verification and interactions.


## 📌 Technologies Used

**Backend Framewok 🌐 ** Node.js & Express 

**Communication & Interaction 📤 :** Slack API

**Development Tunnel 🔗  :** ngrok


## 📋 Architecture Diagram

![architectureDiagram](https://github.com/Royalaviation18/slack-approval-bot/blob/main/assets/architectureDiagram-Slack-Approval-Bot.png)

## 🛠️ Setup & Installation

1️⃣ Clone the Repository

```bash
    git clone https://github.com/your-repo/slack-approval-bot.git
    cd slack-approval-bot
```

2️⃣ Install Dependencies

```bash
    npm install
```

3️⃣ Create a .env File

```bash
    SLACK_BOT_TOKEN=your-slack-bot-token
    PORT = PORT_NUMBER
```

4️⃣ Setup ngrok for Local Development

Since Slack requires a public URL, use ngrok to expose your local server:

```bash
    npm install -g ngrok
    ngrok http 3000
```
Copy the https://your-ngrok-url.ngrok.io and use it in Slack settings.

5️⃣ Start the Server
```bash
    node app.js
```

## 📝 Usage

1️⃣ Register a Slash Command in Slack
- Navigate to Slack API Dashboard → Your App → Slash Commands.

- Click Create New Command:

    - Command: /approval-test

    - Request URL: https://your-ngrok-url.ngrok.io/approval-test

    - Short Description: Request approval from a teammate.

    - Usage Hint: [Enter details]

2️⃣ Set Up Event Subscriptions
    
- Navigate to Slack API Dashboard → Event Subscriptions.

- Enable events and add the following Request URL:
    
```bash
    https://your-ngrok-url.ngrok.io/slack/events
```
- Subscribe to message.channels, app_mention, reaction_added events


3️⃣ Interact with the Bot

- Type /approval-test in Slack.

- A modal appears → Select an approver → Enter details → Click Submit.
- The approver receives a message with Approve/Reject buttons.
- The requester gets notified once the approver makes a decision.

## 🔌 API Endpoints


| Endpoints | Method    | Description                |
| :-------- | :------- | :------------------------- |
| `/slack/events` | `POST` | **Handles Slack event subscriptions** |
| `/approval-test` |`POST` | **Triggers the approval modal** |
| `/slack/interactions` | `POST` | **Handles user interactions modal**|
| `/slack/approval-request`| `POST` | **Sends approval request to approver** |
| `/slack/actions` | `POST` | **Handles Approve/Reject actions** |




## 📷 Screenshots

![Approve Model](https://github.com/Royalaviation18/slack-approval-bot/blob/main/assets/approvalPop.png)

![Approval](https://github.com/Royalaviation18/slack-approval-bot/blob/main/assets/approval.png)


![Approve](https://github.com/Royalaviation18/slack-approval-bot/blob/main/assets/approve.png)


![Notification](https://github.com/Royalaviation18/slack-approval-bot/blob/main/assets/notification.png)



## Demo 🎥
- Click on the image
[![Watch the Demo](https://github.com/Royalaviation18/slack-approval-bot/blob/main/assets/demo.png)](https://www.loom.com/share/d99d8c8b58c349098e818ed3888e995b?sid=2a83a575-7c0a-43bb-8729-c7a5db6587bc)


## 📖 Documentation

 🔗 [Slack API](https://api.slack.com/)

 🔗 [ngrok](https://ngrok.com/)

 
## 📜 License
[MIT](https://github.com/Royalaviation18/slack-approval-bot/blob/main/LICENSE)

## 👨‍💻 Authors

- [Rohit Priyadarshi](https://github.com/Royalaviation18)

## 🗣️ Feedback

If you have any feedback, please reach out to us at rohitp2203@gmail.com



