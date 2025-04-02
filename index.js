const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Slash command to open the modal
app.post("/approval-test", async (req, res) => {
    const { trigger_id } = req.body;

    const modal = {
        trigger_id,
        view: {
            type: "modal",
            callback_id: "approval_modal",
            title: { type: "plain_text", text: "Approval Request" },
            blocks: [
                {
                    type: "input",
                    block_id: "approver_select",
                    element: {
                        type: "users_select",
                        action_id: "approver",
                    },
                    label: { type: "plain_text", text: "Select Approver" }
                },
                {
                    type: "input",
                    block_id: "approval_text",
                    element: {
                        type: "plain_text_input",
                        multiline: true,
                        action_id: "approval_text_input"
                    },
                    label: { type: "plain_text", text: "Approval Details" }
                }
            ],
            submit: { type: "plain_text", text: "Submit" }
        }
    };

    try {
        const response = await axios.post("https://slack.com/api/views.open", modal, {
            headers: {
                Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.data.ok) {
            console.error("Error opening modal:", response.data);
            return res.status(500).send("Failed to open modal.");
        }

        res.sendStatus(200);
    } catch (error) {
        console.error("Error:", error.response?.data || error.message);
        res.sendStatus(500);
    }
});


// Handle modal submission
app.post("/slack/interactions", async (req, res) => {
    const payload = JSON.parse(req.body.payload);

    if (payload.type === "view_submission") {
        const approver = payload.view.state.values.approver_select.approver.selected_user;
        const approvalText = payload.view.state.values.approval_text.approval_text_input.value;
        const requester = payload.user.id;

        const message = {
            channel: approver,
            text: `<@${requester}> has requested approval:\n${approvalText}`,
            attachments: [
                {
                    text: "Approve or Reject?",
                    fallback: "You cannot act on this message",
                    callback_id: "approval_action",
                    actions: [
                        { type: "button", text: "Approve", style: "primary", action_id: "approve", value: requester },
                        { type: "button", text: "Reject", style: "danger", action_id: "reject", value: requester }
                    ]
                }
            ]
        };

        try {
            await axios.post("https://slack.com/api/chat.postMessage", message, {
                headers: {
                    Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
                    "Content-Type": "application/json"
                }
            });

            res.sendStatus(200);
        } catch (error) {
            console.error("Error sending approval request:", error.response?.data || error.message);
            res.sendStatus(500);
        }
    }
});

// Handle Approve/Reject
app.post("/slack/actions", async (req, res) => {
    const payload = JSON.parse(req.body.payload);
    const action = payload.actions[0];
    const requester = action.value;
    const approver = payload.user.id;
    const decision = action.action_id === "approve" ? "approved" : "rejected";

    try {
        await axios.post("https://slack.com/api/chat.postMessage", {
            channel: requester,
            text: `Your approval request was ${decision} by <@${approver}>.`
        }, {
            headers: {
                Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
                "Content-Type": "application/json"
            }
        });

        res.sendStatus(200);
    } catch (error) {
        console.error("Error sending approval response:", error.response?.data || error.message);
        res.sendStatus(500);
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
