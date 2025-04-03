const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Slack Challenge Verification
app.post('/slack/events', (req, res) => {
    if (req.body.challenge) {
        return res.json({ challenge: req.body.challenge });
    }
    console.log("🔹 Received Slack event:", req.body);
    res.sendStatus(200);
});

// Slash command handler
app.post('/approval-test', async (req, res) => {
    const { trigger_id } = req.body;
    res.status(200).send();

    const modal = {
        trigger_id,
        view: {
            type: "modal",
            callback_id: "approval_modal",
            title: { type: "plain_text", text: "Approval Request" },
            blocks: [
                {
                    type: "input",
                    block_id: "approver_block",
                    element: {
                        type: "users_select",
                        action_id: "approver_select",
                        placeholder: { type: "plain_text", text: "Select an approver" }
                    },
                    label: { type: "plain_text", text: "Select Approver" }
                },
                {
                    type: "input",
                    block_id: "approval_text_block",
                    element: {
                        type: "plain_text_input",
                        action_id: "approval_text_input",
                        multiline: true
                    },
                    label: { type: "plain_text", text: "Approval Details" }
                }
            ],
            submit: { type: "plain_text", text: "Submit" }
        }
    };

    try {
        await axios.post('https://slack.com/api/views.open', modal, {
            headers: { Authorization: `Bearer ${SLACK_BOT_TOKEN}`, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error("❌ Error opening modal:", error.response ? error.response.data : error.message);
    }
});

// Handling modal submission
app.post('/slack/interactions', async (req, res) => {
    const payload = JSON.parse(req.body.payload);
    res.status(200).send();

    if (payload.type === 'view_submission') {
        const approver = payload.view.state.values.approver_block.approver_select.selected_user;
        const approvalText = payload.view.state.values.approval_text_block.approval_text_input.value;
        const requester = payload.user.id;

        const message = {
            channel: approver,
            text: `*Approval Request from <@${requester}>*
${approvalText}`,
            attachments: [
                {
                    text: "Do you approve this request?",
                    callback_id: "approval_response",
                    actions: [
                        { name: "approve", text: "Approve ✅", type: "button", style: "primary", value: JSON.stringify({ action: "approve", requester }) },
                        { name: "reject", text: "Reject ❌", type: "button", style: "danger", value: JSON.stringify({ action: "reject", requester }) }
                    ]
                }
            ]
        };

        try {
            await axios.post('https://slack.com/api/chat.postMessage', message, {
                headers: { Authorization: `Bearer ${SLACK_BOT_TOKEN}`, 'Content-Type': 'application/json' }
            });
        } catch (error) {
            console.error("❌ Error sending approval request:", error.response ? error.response.data : error.message);
        }
    }
});

// Handle Approver's decision
app.post('/slack/actions', async (req, res) => {
    const payload = JSON.parse(req.body.payload);
    const action = payload.actions[0];
    const { action: decision, requester } = JSON.parse(action.value);
    const approver = payload.user.id;
    const originalMessageTs = payload.message.ts;
    const channelId = payload.channel.id;

    res.status(200).send();

    const updatedMessage = {
        channel: channelId,
        ts: originalMessageTs,
        text: `*Approval Request from <@${requester}>*
This request has been *${decision.toUpperCase()}* by <@${approver}>.`,
        attachments: []
    };

    try {
        await axios.post('https://slack.com/api/chat.update', updatedMessage, {
            headers: { Authorization: `Bearer ${SLACK_BOT_TOKEN}`, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error("❌ Error updating approval request:", error.response ? error.response.data : error.message);
    }

    const responseMessage = {
        channel: requester,
        text: `Your approval request has been *${decision.toUpperCase()}* by <@${approver}>.`
    };

    try {
        await axios.post('https://slack.com/api/chat.postMessage', responseMessage, {
            headers: { Authorization: `Bearer ${SLACK_BOT_TOKEN}`, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error("❌ Error sending approval result:", error.response ? error.response.data : error.message);
    }
});

app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
