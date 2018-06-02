var socket = io();

$(".btn-othello").click(function(){
    promptOthelloGameMode();
})

$("#btn-select-game-mode").click(function(){
    returnToGameMode();
})

$(".othello-two-player").click(function(e){
    $('#select-game-type').css('display', 'none');
    $("#collect-player-info").css('display', 'block');
})

$("#user-info-form").on('submit', function(e){
    e.preventDefault();
})

$("#center-container button").hover(function(){
    $(this).removeClass("btn-primary").addClass("btn-success");
}, function(){
    $(this).removeClass("btn-success").addClass("btn-primary");
})

function promptOthelloGameMode(){
    $('#select-game').css('display', 'none');
    $('#select-game-type').css('display', 'block');
    $("#btn-select-game-mode").css('display', 'block');
}

function returnToGameMode(){
    $('#select-game').css('display', 'block');
    $('#select-game-type').css('display', 'none');
    $("#btn-select-game-mode").css('display', 'none');
    $('#collect-player-info').css('display', 'none');
}
$('#submit-user-info').click(function(){
    let userName = $('#input-name').val();
    let findButton = $('#submit-user-info');
    if(!userName || userName.trim().length < 1){
        console.log('invalid user name');
        $('#invalid-name-warning').css('display', 'block');
        return;
    }
    findButton.html("Looking for game...")
    socket.emit('searchOthello', {
        "userName": userName,
        "id": window.localStorage.getItem('id'),
        "pairingHash": null
    });
})


socket.on('connect', function(){
    const id = window.localStorage.getItem('id') ? window.localStorage.getItem('id') : null;
    console.log('id: ', id);
    socket.emit('validateUser', {id: id}, function(err, response){
        console.log('server response: ', response);
        if(err){
            console.log(err);
            window.localStorage.setItem('id', response.id);
        }
    });
})

socket.on('foundOthelloGame', function(response){
    console.log('found game response: ',response);
    window.location = `${response.path}`
})