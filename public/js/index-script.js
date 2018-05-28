$(".btn-othello").click(function(){
    promptOthelloGameMode();
})

$("#btn-select-game-mode").click(function(){
    returnToGameMode();
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
}
