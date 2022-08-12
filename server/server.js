// Source code from https://youtu.be/ppcBIHv_ZPs

const io = require('socket.io')();
io.set('transports', ['websocket']);
const { initGame } = require('./game');
const { makeid } = require('./utils');

// gameRooms contains key: gameCode. values: list of players, current score
// gameRooms = {'a4b5k1': {players: [], score: {}}, 
//              '4g2fa7': {players: [{'clientId':'...', 'userName':'...', 'iconURL':'...'}, ...], score: {}},
//               etc.. }
const gameRooms = {}


io.on("connection", socket => {
    console.log("player connected: ", socket.id) //id of connected player
    //client.emit('createdFriendGame', '123test') server crashes when I uncomment this
    socket.on("createFriendGame", data => {
        console.log('creating friend game for: ', data)
        data = JSON.parse(data)
        console.log('parsed data: ', data)
        // user = {'iconURL': 'http://__.jpg', 'userName':'testuser01'}
        data['user']['clientId'] = client.id 
        let user = data['user']

        let roomName = makeid(5);

        // add to the gameRooms a user and gameRoom object
        gameRooms[roomName] = {'players':[user], 'score': {}}
        client.join(roomName)
        console.log(`User: ${user['userName']} w/ clientID: ${client.id} has created gameRoom: ${roomName}`)
        // emits the call back to the client that sent the createGame socket
        client.emit('createdFriendGame', roomName)
    })
    
    socket.on("joinFriendGame", joinFriendGame)
    socket.on("getPlayers", getFriendPlayers)
    socket.on("cancelGame", cancelFriendGame)
    socket.on("leftGame", leftFriendGame)



 

    function createFriendGame(data) {
        console.log('creating friend game for: ', data)
        data = JSON.parse(data)
        console.log('parsed data: ', data)
        // user = {'iconURL': 'http://__.jpg', 'userName':'testuser01'}
        data['user']['clientId'] = client.id 
        let user = data['user']

        let roomName = makeid(5);

        // add to the gameRooms a user and gameRoom object
        gameRooms[roomName] = {'players':[user], 'score': {}}
        client.join(roomName)
        console.log(`User: ${user['userName']} w/ clientID: ${client.id} has created gameRoom: ${roomName}`)
        // emits the call back to the client that sent the createGame socket
        client.emit('createdFriendGame', roomName)
    }

    function joinFriendGame(data) {
        data = JSON.parse(data)
        let roomName = data['roomName']
        // add the users client id to their user object
        data['user']['clientId'] = client.id
        let user = data['user']

        const room = io.sockets.adapter.rooms[roomName]
        
        // if the room doesnt exist that means that the roomName entered is invalid (no game with such a code exists)
        if (!room) {
            client.emit('invalidGame')
            return
        }
        gameRooms[roomName]['players'].push(user)

        client.join(roomName)
        console.log(`User: ${user['userName']} w/ clientID: ${client.id} has joined gameRoom: ${roomName}`)
        client.emit("joinedFriendGame", roomName)
    }

    function getFriendPlayers(roomName) {
        let players = gameRooms[roomName]['players']
        for (let i=0; i<players.length; i++) {
            // iterate over each player in the gameRoom and grab their client id
            let clientId = players[i]['clientId']
            // we then send a updatePlayers socket to each client/player containing a json object containing a list of all the players in the lobby
            io.to(clientId).emit('updatePlayers', gameRooms[roomName]); 
        }


    }

    function cancelFriendGame(roomName) {
        let players = gameRooms[roomName]['players']
        for (let i=0; i<players.length; i++) {
            // iterate over each player in the gameRoom and grab their client id
            let clientId = players[i]['clientId']
            // we then send a updatePlayers socket to each client/player telling them the game has been cancelled (java app then kicks them out of the lobby page)
            io.to(clientId).emit('gameCancelled'); 
        } 
        // now remove gameRoom object from gameRooms
        delete gameRooms[roomName]
    }
    function leftFriendGame(roomName) {
        // find the index of the player that sent the "I just left this friend game" socket emit"
        let indexOfLeftPlayer = gameRooms[roomName]['players'].findIndex(player => player.clientId === client.id)
        // now remove that player from the players list in the gameRoom object
        gameRooms[roomName]['players'].splice(indexOfLeftPlayer, 1) 
        let players = gameRooms[roomName]['players']
        for (let i=0; i<players.length; i++) {
            // iterate over each player in the gameRoom and grab their client id
            let clientId = players[i]['clientId']
            // we then send a updatePlayers socket to each client/player telling them to update their lobby view (as a player has left the lobby)
            io.to(clientId).emit('updatePlayers', gameRooms[roomName]); 
        } 
    }

})
//listen on provided env port or on port 3000 as a default fallback
io.listen(process.env.PORT || 3000)
