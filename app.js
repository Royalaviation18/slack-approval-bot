const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Slack credentials
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;
const SLACK_CHANNEL_ID = process.env.SLACK_CHANNEL_ID;

// 🔹 Slack Event Subscription (Fix for 404)
app.post("/slack/events", async (req, res) => {
    console.log("🔹 Slack Event Received:", req.body);

    if (req.body.type === "url_verification") {
        return res.json({ challenge: req.body.challenge });
    }

    res.status(200).send();
});

// 🔹 Slash Command: /approval-test
app.post("/approval-test", async (req, res) => {
    res.status(200).send(); // Acknowledge Slack command

    const approvers = await getSlackUsers();

    await axios.post("https://slack.com/api/views.open", {
        trigger_id: req.body.trigger_id,
        view: {
            type: "modal",
            callback_id: "approval_modal",
            title: { type: "plain_text", text: "Approval Request" },
            blocks: [
                {
                    type: "input",
                    block_id: "approver_block",
                    label: { type: "plain_text", text: "Select an Approver" },
                    element: {
                        type: "static_select",
                        action_id: "approver",
                        options: approvers,
                    },
                },
                {
                    type: "input",
                    block_id: "approval_text_block",
                    label: { type: "plain_text", text: "Approval Text" },
                    element: {
                        type: "plain_text_input",
                        action_id: "approval_text",
                        multiline: true,
                    },
                }
            ],
            submit: { type: "plain_text", text: "Submit" }
        }
    }, { headers: { Authorization: `Bearer ${SLACK_BOT_TOKEN}` } });
});

// 🔹 Fetch Slack Users
async function getSlackUsers() {
    try {
        const response = await axios.get("https://slack.com/api/users.list", {
            headers: { Authorization: `Bearer ${SLACK_BOT_TOKEN}` },
        });

        if (!response.data.ok) throw new Error("Failed to fetch users");

        return response.data.members
            .filter(user => !user.is_bot && !user.deleted)
            .map(user => ({
                text: { type: "plain_text", text: user.real_name },
                value: user.id,
            }));
    } catch (error) {
        console.error("❌ Error fetching users:", error.message);
        return [];
    }
}

// 🔹 Handle Modal Submission
app.post("/slack/interactions", async (req, res) => {
    const payload = JSON.parse(req.body.payload);
    
    if (payload.type === "view_submission") {
        res.status(200).send(); // Acknowledge

        const approverId = payload.view.state.values.approver_block.approver.selected_option.value;
        const approvalText = payload.view.state.values.approval_text_block.approval_text.value;
        const requesterId = payload.user.id;

        await axios.post("https://slack.com/api/chat.postMessage", {
            channel: approverId, // Send approval request to Approver
            text: `<@${approverId}>, you have an approval request from <@${requesterId}>.`,
            blocks: [
                {
                    type: "section",
                    text: { type: "mrkdwn", text: `*Approval Request from <@${requesterId}>:* \n\n ${approvalText}` },
                },
                {
                    type: "actions",
                    elements: [
                        {
                            type: "button",
                            text: { type: "plain_text", text: "Approve" },
                            style: "primary",
                            value: `${requesterId}`,
                            action_id: "approve_action",
                        },
                        {
                            type: "button",
                            text: { type: "plain_text", text: "Reject" },
                            style: "danger",
                            value: `${requesterId}`,
                            action_id: "reject_action",
                        },
                    ],
                },
            ],
        }, { headers: { Authorization: `Bearer ${SLACK_BOT_TOKEN}` } });
    } else if (payload.type === "block_actions") {
        res.status(200).send(); // Acknowledge the button click

        const action = payload.actions[0];
        const requesterId = action.value;
        const approverId = payload.user.id;
        let responseText = "";

        if (action.action_id === "approve_action") {
            responseText = `✅ Approved by <@${approverId}>`;
        } else if (action.action_id === "reject_action") {
            responseText = `❌ Rejected by <@${approverId}>`;
        }

        // Notify the requester about the approval/rejection
        await axios.post("https://slack.com/api/chat.postMessage", {
            channel: requesterId, // Notify Requester
            text: `Your approval request was processed: ${responseText}`,
        }, { headers: { Authorization: `Bearer ${SLACK_BOT_TOKEN}` } });

        // Notify the approver
        await axios.post("https://slack.com/api/chat.postMessage", {
            channel: approverId,
            text: `You have ${responseText} the request from <@${requesterId}>.`,
        }, { headers: { Authorization: `Bearer ${SLACK_BOT_TOKEN}` } });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
