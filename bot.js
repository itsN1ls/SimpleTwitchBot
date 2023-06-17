const tmi = require('tmi.js');
const fs = require('fs');
const readline = require('readline');
const axios = require('axios');
require('dotenv').config(); // Load environment variables from .env file

const opts = {
  identity: {
    username: process.env.USERNAME,
    password: process.env.TOKEN
  },
  channels: [
    'channel1',
    'channel2'
  ]
};

const client = new tmi.client(opts);
const customCommandsFile = 'custom_commands.json';
let customCommands = [];

// Load custom commands from file
function loadCustomCommands() {
  try {
    const data = fs.readFileSync(customCommandsFile, 'utf8');
    customCommands = JSON.parse(data);
  } catch (err) {
    console.error('Error parsing custom commands file:', err);
  }
}

// Save custom commands to file
function saveCustomCommands() {
  try {
    fs.writeFileSync(customCommandsFile, JSON.stringify(customCommands));
  } catch (err) {
    console.error('Error saving custom commands:', err);
  }
}

// Load custom commands on startup
loadCustomCommands();

client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);

client.connect();

// Create a readline interface for reading user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt for user input and send messages
function promptAndSendMessage() {
  rl.question('Enter channel@message: ', (input) => {
    // Extract channel and message from the input
    const [channel, message] = input.split('@');

    // Replace "tuesday" with "chewsday" in the message
    const modifiedMessage = message.replace(/tuesday/gi, 'chewsday');

    // Send the modified message to the specified channel
    client.say(channel, modifiedMessage)
      .then(() => {
        console.log(`Message sent successfully to ${channel}: ${modifiedMessage}`);
        promptAndSendMessage(); // Prompt for the next message
      })
      .catch((err) => {
        console.error('Error sending message:', err);
        promptAndSendMessage(); // Prompt for the next message
      });
  });
}

// Call the function to start prompting for user input
promptAndSendMessage();

function onMessageHandler(target, context, msg, self) {
  if (self) return;

  const commandName = msg.trim();

  console.log(`Received message in ${target} from ${context.username}: ${commandName}`);

  if (opts.channels.includes(target)) {
    if (commandName.startsWith('!followage')) {
      const args = commandName.split(' ');
      if (args.length === 2) {
        const user = args[1];

        axios.get(`https://decapi.me/twitch/followage/${target.slice(1)}/${user}`)
          .then((response) => {
            const followage = response.data;
            const followageMessage = `The followage of ${user} is ${followage}`;
            client.say(target, followageMessage)
              .then(() => console.log('Followage command executed successfully!'))
              .catch((err) => console.error('Error executing followage command:', err));
          })
          .catch((err) => {
            console.error('Error fetching followage:', err);
          });
      }
    } else if (commandName === '!doplay') {
      client.say(target, '!play 12')
        .then(() => console.log('Response sent successfully!'))
        .catch((err) => console.error('Error sending response:', err));
    } else if (commandName === '!lurk') {
      client.say(target, 'imagine going away')
        .then(() => console.log('Response sent successfully!'))
        .catch((err) => console.error('Error sending response:', err));
    } else if (commandName === '!unlurk') {
      client.say(target, 'you are finally here again')
        .then(() => console.log('Response sent successfully!'))
        .catch((err) => console.error('Error sending response:', err));
    } else if (commandName.startsWith('!love')) {
      const args = commandName.split(' ');
      if (args.length >= 2) {
        const targetUser = context.username;
        const targetArgument = args[1];
        const lovePercentage = Math.floor(Math.random() * 101); // Random number from 0 to 100
        const response = `There is a ${lovePercentage}% chance of love between ${targetUser} and ${targetArgument}`;
        client.say(target, response)
          .then(() => console.log('Response sent successfully!'))
          .catch((err) => console.error('Error sending response:', err));
      }
    } else if (commandName.startsWith('!comadd')) {
      if (
        context.mod ||
        (context.badges && context.badges.moderator === '1') ||
        context.username.toLowerCase() === 'itsnilsssss'
      ) {
        const args = commandName.split(' ');
        if (args.length >= 3) {
          const command = args[1];
          const response = args.slice(2).join(' ');

          // Add the custom command to the list
          const newCommand = { command, response };
          customCommands.push(newCommand);
          saveCustomCommands();

          console.log('Custom command stored successfully!');
          client.say(target, 'Success!');

          return; // Stop further processing of the message
        }
      } else {
        console.log('Only moderators can use the !comadd command.');
      }
    } else if (commandName.includes('tuesday')) {
      const updatedMessage = commandName.replace(/tuesday/gi, 'chewsday');
      client.say(target, updatedMessage)
        .then(() => console.log('Updated message sent successfully!'))
        .catch((err) => console.error('Error sending updated message:', err));
    }
  }
}

function onConnectedHandler(addr, port) {
  console.log(`* Connected to ${addr}:${port}`);
}
