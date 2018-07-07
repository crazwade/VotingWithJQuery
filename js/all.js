var order = {};

$( document ).ready(function() {
    $('#login_button').click(function(event){
        $('.login').slideToggle(300);
    })
    InitialUI();
});

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function HttpGet(name) {
    if (name = (new RegExp('[?&]' + encodeURIComponent(name) + '=([^&]*)')).exec(location.search))
        return decodeURIComponent(name[1]);
}

function ShowIndexVoteInfo()
{
    var voteItemStr = '<div class="nowvoting"> <h2>台北市市長選舉</h2> <div class="candidate"> <ul> <li><img class="candidate_image" src="images/logo1.png" alt=""></li> <li><img class="candidate_image" src="images/logo1.png" alt=""></li> <li><img class="candidate_image" src="images/logo1.png" alt=""></li> <li><img class="candidate_image" src="images/logo1.png" alt=""></li> <div class="clear"></div> </ul> </div> </br> <button class="joinvote">投票詳情</button> </div>'
    var voteListArea = document.querySelector(".allvote");
    var str = "";
    database.ref('voting/Vote').once('value', function (snapshot) {
        snapshot.forEach(function (data) {
            str = "";
            str += '<div class="nowvoting"> <h2>'+data.val().VoteName+'</h2> <div class="candidate"> <ul>';
            for(index in data.val().Candidate)
            {
                str += '<li><img class="candidate_image" src="images/candidates/' + data.val().Candidate[index].Image +'" alt=""></li>';
            }
            str += '<div class="clear"></div> </ul> </div> </br> <a href="vote.html?votename=' + data.val().VoteName+'" class="joinvote">投票詳情</a> </div>';
            voteListArea.innerHTML += str;
        });
        document.querySelector("#loading").outerHTML = "";
    }).then(function () {
    });
}

function ShowVotePage()
{
    var votename = HttpGet("votename");
    if (votename == "")
    {
        alert("指定的投票不存在");
        location.href = 'index.html';
        return;
    }
    
    database.ref('voting/Vote/').once('value', function (snapshot) {
        var voteListArea = document.querySelector(".nowvoting");
        var canVote = false;
        snapshot.forEach(function (data) {
            if (data.val().VoteName == votename)
            {
                var str;
                str = "";
                str += '<h2 id = "vote_name">' + data.val().VoteName + '</h2>'
                for (index in data.val().Candidate) {
                    order[index] = data.val().Candidate[index].Name;
                    str += '<div class="acandidate" id="' + data.val().Candidate[index].Name + '"> <img class="candidate-image" src="images/candidates/' + data.val().Candidate[index].Image + '" alt=""> <h4 class="candidate-name">' + data.val().Candidate[index].Name + '</h4>';
                    // if (canVote)
                    //     str += ' <input type="radio" name="cadidate" id="check' + index + '" value="' + data.val().Candidate[index].Name + '" class="cb"> <label for="check' + index + '"></label>';
                    // else
                    str += ' <input type="radio" name="cadidate" id="check' + index + '" value="' + data.val().Candidate[index].Name + '" class="cb"> <label style="opacity:0;" for="check' + index + '"></label>';
                    str += '<div class="info"> <div class="progress-bar-bg"> <div class="progress-bar"></div><p class="num">' + 0 + '</p></div> <p class="percentage"></p></div> <div class="clear"></div> </div>';
                }
                // if (canVote)
                //     str += '<button id="vote-button" class="button" onclick="OnVoteButtonClicked()">確認</button>';
                // else
                    str += '<button style="opacity:0;" id="vote-button" class="button" onclick="OnVoteButtonClicked()">確認</button>';
                voteListArea.innerHTML = str;
            }
        });
    }).then(function () {
        UpdateNum(votename);
        CheckCanVote();
    });
}

function CheckCanVote()
{
    var email = "";
    var votename = HttpGet("votename");
    if (firebase.auth().currentUser)
    {
        email = firebase.auth().currentUser.email;
        if (document.getElementsByClassName("hint").length > 0)
            document.getElementsByClassName("hint")[0].outerHTML = "";
    }
    else
    {
        if (document.getElementsByClassName("hint").length <= 0) {
            var hint = '<p class="hint" style=" color: red; font-weight: bold; "><a href=javascript:$(".login").slideDown()>登入</a>或<a href="signup.html">註冊</a>以參與投票</p>';
            document.querySelector(".nowvoting").innerHTML += hint;
        }
    }
    database.ref('member').once('value', function (snapshot) {
        snapshot.forEach(function (data) {
            if (data.val().Email.toUpperCase() == email.toUpperCase()) {
                if (votename.substring(0, 3) == data.val().Area) {
                    database.ref('voting/VoteRecord').once('value', function (snapshot) {
                        var flag = false;
                        snapshot.forEach(function (data) {
                            if(data.val().Voter == email && data.val().VoteName == votename)
                            {
                                flag = true;
                            }
                        });
                        if(!flag)
                        {
                            canVote = true;
                            document.querySelector("#vote-button").style.opacity = 1;
                            var radios = document.querySelectorAll(".acandidate label");
                            for(var i = 0; i < radios.length; i++)
                            {
                                radios[i].style.opacity = "1";
                            }                            
                        }
                        else
                        {
                            if (document.getElementsByClassName("hint").length <= 0) {
                                var hint = '<p class="hint" style=" color: red; font-weight: bold; ">你已經參與過此次投票</p>';
                                document.querySelector(".nowvoting").innerHTML += hint;
                            }
                        }
                    });                    
                }
                else if (document.getElementsByClassName("hint").length <= 0)
                {
                    var hint = '<p class="hint" style=" color: red; font-weight: bold; ">你只能參與你所在縣市的投票</p>';
                    document.querySelector(".nowvoting").innerHTML += hint;
                }
            }
        })
    });
}

function DoOrder()
{
    var votename = HttpGet("votename");
    var flag = true;
    var VoteData = GetScoreByVoteName(votename);
    console.log(VoteData);
    while (flag) {
        flag = false;
        for (index in order) {
            if (VoteData[order[index]] == undefined)
                VoteData[order[index]] = 0;
            if(index == 0)
                continue;
            if (VoteData[order[index]] > VoteData[order[index-1]])
            {
                Swap(index, index-1);
                flag = true;
            }
        }
    }
    var i = 0;
    console.log(VoteData);
    for (index in order) {
        if (i == 0 && VoteData[order[index]] != 0)
            document.getElementById(order[index]).style.background = "#ce3c3c";
        else
            document.getElementById(order[index]).style.background = "unset";
        i++;
    }
}

function GetScoreByVoteName(VoteName)
{
    var VoteData = {};
    database.ref('voting/VoteRecord/').once('value', function (snapshot) {
        snapshot.forEach(function (data) {
            if (data.val().VoteName == VoteName) {
                if (VoteData[data.val().VoteTo] == undefined)
                    VoteData[data.val().VoteTo] = 1;
                else
                    VoteData[data.val().VoteTo]++;
            }
        });
    });
    return VoteData;
}

async function UpdateNum(VoteName)
{
    var VoteData = {};
    await database.ref('voting/VoteRecord/').once('value', function (snapshot) {
        snapshot.forEach(function (data) {
            if (data.val().VoteName == VoteName) {
                if (VoteData[data.val().VoteTo] == undefined)
                    VoteData[data.val().VoteTo] = 1;
                else
                    VoteData[data.val().VoteTo]++;
            }
        });
    });
    var data = VoteData;
    var allVoteCount = 0;
    for(index in data)
    {
        allVoteCount += Number.parseInt(data[index]);
    }
    var candidates = document.querySelectorAll(".acandidate");
    for(var i = 0; i < candidates.length; i++)
    {
        var id = candidates[i].id;
        var name = candidates[i].querySelector(".candidate-name").innerText;
        var num = candidates[i].querySelector(".num");
        var percentage = candidates[i].querySelector(".percentage");
        var progressbar = candidates[i].querySelector(".progress-bar");
        if (data[name] == undefined)
            data[name] = 0;
        num.innerText = data[name];
        var percentageValue;
        if (allVoteCount != 0)
            percentageValue = (Number.parseFloat(data[name]) / allVoteCount) * 100;
        else
            percentageValue = 0;
        var percentageFixed = new Number(percentageValue);
        percentageFixed = percentageFixed.toFixed(1);
        percentage.innerText = percentageFixed+ "%";
        progressbar.style.width = percentageFixed+"%";
    }
    DoOrder();
}
var isInitialize = false;
function Swap(index1, index2)
{
    var tmp = order[index1];
    order[index1] = order[index2];
    order[index2] = tmp;
    var id1 = "#"+order[index1];
    var id2 = order[index2];
    if (!isInitialize)
        SwapAnim(id1, id2);
    else
        SwapAnim(id1, id2);
    isInitialize = true;
}

var isSwaping = false;
function FastSwapAnim(id1, id2)
{
    if (isSwaping)
        window.setTimeout(function () {
            FastSwapAnim(id1, id2);
        }, 100);
    else
        isSwaping = true;
    $(id1).swap({
        target: id2, // Mandatory. The ID of the element we want to Swap with  
        speed: 0, // Optional. The time taken in milliseconds for the animation to occur  
        callback: function () { // Optional. Callback function once the Swap is complete  
            // alert("Swap Complete");
            var element1 = document.querySelector(id1);
            var element2 = document.querySelector("#" + id2);
            element1.style = "background:" + element1.style.background + ";";
            element2.style = "background:" + element2.style.background + ";";
            var tmp = element1.outerHTML;
            element1.outerHTML = element2.outerHTML;
            element2.outerHTML = tmp;
            isSwaping = false;
        }
    });
}

function SwapAnim(id1, id2)
{
    if (isSwaping)
        window.setTimeout(function(){
            SwapAnim(id1, id2);
        }, 100);
    else
        isSwaping = true;
    $(id1).swap({
        target: id2, // Mandatory. The ID of the element we want to Swap with  
        speed: 300, // Optional. The time taken in milliseconds for the animation to occur  
        callback: function () { // Optional. Callback function once the Swap is complete  
            // alert("Swap Complete");
            var element1 = document.querySelector(id1);
            var element2 = document.querySelector("#"+id2);
            element1.style = "background:"+element1.style.background+";";
            element2.style = "background:" + element2.style.background+";";
            var tmp = element1.outerHTML;
            element1.outerHTML = element2.outerHTML;
            element2.outerHTML = tmp;
            isSwaping = false;
        }
    });
}

function OnVoteButtonClicked()
{
    var target = GetSelectedCandidator();
    if (target != undefined)
        CheckVoteDialogBox(target);
}

function CheckVoteDialogBox(Name) {
    if (confirm("確定要投給「"+Name+"」嗎？")) {
        var votename = HttpGet("votename");
        Vote(votename, Name, GetUser());
        DisableVoting();
    } else {
        txt = "You pressed Cancel!";
    }
}

function GetUser()
{
    return firebase.auth().currentUser.email;
}

function DisplayUserData()
{
    if(isLogin())
    {
        var email = firebase.auth().currentUser.email;

        var newName = document.getElementById("name");
        var newEmail = document.getElementById("email");
        newEmail.value = email;
        database.ref('member').once('value', function (snapshot) {
            snapshot.forEach(function (data) {
                if (data.val().Email.toUpperCase() === email.toUpperCase()) {
                    newName.value = data.val().Name;

                    ShowLoadingPanel(false);
                }
            })
        });
    }
    else
    {
        window.setTimeout(DisplayUserData, 100);
        ShowLoadingPanel(true);
    }
}

function GetSelectedCandidator()
{
    var radios = document.getElementsByName('cadidate');

    for (var i = 0, length = radios.length; i < length; i++) {
        if (radios[i].checked) {
            return radios[i].value;
        }
    }
}

function DisableVoting()
{
    document.querySelector("#vote-button").style.opacity = 0;
    var radios = document.querySelectorAll("label");
    for(index in radios)
    {
        radios[index].style.opacity = 0;
    }
}

function ShowFullScreenMessage(message)
{
    var panel = document.querySelector(".fullscreen");
    var text = document.querySelector(".fullscreen #popup-txt");
    text.innerText = message;
    panel.style.display = "block";
}

function DisableFullScreenMessage()
{
    var panel = document.querySelector(".fullscreen");
    panel.style.display = "none";
}

function Reload()
{
    window.location.reload(false); 
}

function ShowLoadingPanel(isShow)
{
    if(isShow)
        document.getElementById("loadingpanel").style.display = "block";
    else
        document.getElementById("loadingpanel").style.display = "none";
}

function ShowVoteRecord()
{
    console.log("dododdo");
    if(!isLogin())
    {
        window.setTimeout(function(){
            ShowVoteRecord();
        }, 100);
    }
    else
    {
        var email = firebase.auth().currentUser.email;
        var str = "";
        var record = document.getElementById("record");
        console.log(email);
        database.ref('voting/VoteRecord').once('value', function (snapshot) {
            snapshot.forEach(function (data) {
                if (email.toUpperCase() == data.val().Voter.toUpperCase()) {
                    str += '<tr> <td>' + data.val().VoteName + '</td> <td>' + data.val().VoteTime + '</td> </tr>';
                }
            });
            record.innerHTML += str;
        });
    }
    
}