var config = {
    apiKey: "AIzaSyBQqWhs8RIVHe-1Kv1CFEB8VafGY5GnSlM",
    authDomain: "web-voting.firebaseapp.com",
    databaseURL: "https://web-voting.firebaseio.com",
    projectId: "web-voting",
    storageBucket: "",
    messagingSenderId: "321763481882"
};
firebase.initializeApp(config);

var database = firebase.database();

function OnSignUpButtonClicked()
{
    var email = document.querySelector("#signup-email").value;
    var name = document.querySelector("#signup-name").value;
    var area = document.querySelector("#signup-area").value;
    var password = document.querySelector("#signup-password").value;
    SignUp(email,password, name, area);
}

function SignUp(email, password, name, area)
{
    var isSuccess = true;
    ShowFullScreenMessage("註冊中...");
    firebase.auth().createUserWithEmailAndPassword(email, password)
        .catch(function (error) {
            // Handle Errors here.
            var errorCode = error.code;
            var errorMessage = error.message;
            isSuccess = false;
            if (errorCode == 'auth/weak-password') {
                alert('密碼強度太弱，請重新設定');
            } else {
                alert(errorMessage);
            }
            console.log(error);
        }).then(function(){
            if(isSuccess)
            {
                ShowFullScreenMessage("註冊成功");
                AddUserToDatabase(email, name, area);
                window.setTimeout(redirectToIndex,1000);
            }
            else
                DisableFullScreenMessage();
        });
}

function LogOut()
{
    firebase.auth().signOut().then(function () {
        window.location.href = "index.html";
    }, function (error) {
        // An error happened.
    });
}

function AddUserToDatabase(email, name, area)
{
    database.ref('member').push({
        Email: email,
        Name: name,
        Area: area
    }).then(function(){
        // if(isLogin())
        //     window.location.reload(false);
    });
}

function OnLogInButtonClicked()
{
    var email = document.querySelector("#login_email").value;
    var password = document.querySelector("#login_password").value;
    ShowFullScreenMessage("登入中...");
    LogIn(email,password);
}

function LogIn(email, password)
{
    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION)
        .then(function () {
            // Existing and future Auth states are now persisted in the current
            // session only. Closing the window would clear any existing state even
            // if a user forgets to sign out.
            // ...
            // New sign-in will be persisted with session persistence.
            return firebase.auth().signInWithEmailAndPassword(email, password)
                .then(function (user) {
                    FinishLogin();
                })
                .catch(function (error) {
                    DisableFullScreenMessage();
                    console.log(error);
                    alert("登入失敗");
                });
        })
        .catch(function (error) {
            // Handle Errors here.
            var errorCode = error.code;
            var errorMessage = error.message;
        });

}

function isLogin()
{
    var user = firebase.auth().currentUser;
    if (user != null) {
        return true;
    } else {
        return false;
    }
}

function redirectToIndex()
{
    console.log("redir");
    if(isLogin())
    {
        window.location.href = "index.html";
        console.log("redirrrr");
    }
    else
    {
        window.setInterval(function () {
            redirectToIndex();
        }, 100);
    }
}

function FinishLogin()
{    
    DisableFullScreenMessage();
    $('.login').slideToggle(300);    
    InitialUI();
}

firebase.auth().onAuthStateChanged(function (user) {
    console.log("changeState");
    if (user) {
        document.querySelector("#user-button").style.display = "block";
        document.querySelector("#login_button").style.display = "none";
    } else {
        document.querySelector("#user-button").style.display = "none";
        document.querySelector("#login_button").style.display = "block";
    }
});

function InitialUI()
{
    if (isLogin()) {
        document.querySelector("#user-button").style.display = "block";
        document.querySelector("#login_button").style.display = "none";
        console.log("login");
    }
    else {
        document.querySelector("#user-button").style.display = "none";
        document.querySelector("#login_button").style.display = "block";
        console.log(" not login");
    }
}

function OnForgetPasswordButtonClicked()
{
    var email = document.getElementById("forget_email").value;
    SendForgetPasswordEmail(email);
    ShowLoadingPanel(true);
}

function SendForgetPasswordEmail(email) {
    firebase.auth().sendPasswordResetEmail(email).then(function () {
        ShowLoadingPanel(false);
        alert("已將重設密碼郵件寄到信箱");
    }).catch(function (error) {
        // An error happened.
    });
}

function Vote(VoteName, CandidateName, Voter) {
    database.ref('voting/VoteRecord').once('value', function (snapshot) {
        snapshot.forEach(function (data) {
            if(data.val().VoteName == VoteName && data.val().Voter == Voter)
            {
                console.log("你已經投過這個投票了");                
            }
        });
    });
    database.ref('voting/VoteRecord').push({
        VoteName: VoteName,
        VoteTime: GetCurrentDate(),
        VoteTo: CandidateName,
        Voter: Voter
    }).then(function(){
        console.log("投票成功");
        UpdateNum(HttpGet("votename"));
    });
}

function GetUserArea()
{
    var email = firebase.auth().currentUser.email;
    database.ref('member').once('value', function (snapshot) {
        snapshot.forEach(function (data) {
            if(data.val().Email === email)
            {
                Area = data.val().Area;
                return Area;
            }
        })
    });
}

function OnUpdateUserDataButtonClicked()
{
    var newName = document.getElementById("name").value;
    var oldPassword = document.getElementById("password").value;
    var newPassword = document.getElementById("newpassword").value;
    var newPassword2 = document.getElementById("newpassword2").value;
    var newEmail = document.getElementById("email").value;
    if(newPassword != newPassword2)
    {
        alert("兩次密碼輸入不同");
    }
    else
    {
        UpdateUserData(newName, oldPassword, newPassword, newEmail);
    }
}

function UpdateUserData(newName, oldPassword, newPassword, newEmail){
    var isFail = false;
    console.log(oldPassword);
    firebase.auth().currentUser.reauthenticateWithCredential(firebase.auth.EmailAuthProvider.credential(firebase.auth().currentUser.email, oldPassword)).catch(function(e){
        alert("密碼錯誤");
        isFail = true;
    }).then(async function(){
        if(!isFail)
        {
            ShowLoadingPanel(true);
            var nowEmail = firebase.auth().currentUser.email;
            var isError = false;
            await database.ref('member').once('value', function (snapshot) {
                snapshot.forEach(function (data) {
                    if (data.val().Email.toUpperCase() === nowEmail.toUpperCase()) {
                        database.ref('member').child('/'+data.key)
                            .update({
                                Name: newName,
                                Email: newEmail
                            }).catch(function (error) {
                                isError = true;
                            });
                    }
                });
            });
            if (isFail) {
                alert("發生錯誤，請重新輸入");
                return;
            }
            var user = firebase.auth().currentUser;

            console.log("change password");
            await user.updatePassword(newPassword).then(function () {
                // Update successful.
            }).catch(function (error) {
                isError = true;
                });
            if (isFail)
            {
                alert("發生錯誤，請重新輸入");
                return;
            }
            await user.updateEmail(newEmail).then(function () {
                // Update successful.
            }).catch(function (error) {
                isError = true;
                });
            if (isFail) {
                alert("發生錯誤，請重新輸入");
                return;
            }
            await database.ref('voting/VoteRecord').once('value', function (snapshot) {
                snapshot.forEach(function (data) {
                    if (data.val().Voter.toUpperCase() === nowEmail.toUpperCase()) {
                        database.ref('voting/VoteRecord').child('/' + data.key)
                            .update({
                                Voter: newEmail
                            }).catch(function (error) {
                                isError = true;
                            });
                    }
                });
            });
            if(isError)
                alert("發生錯誤，請重新輸入");
            else
            {
                ShowLoadingPanel(false);
                alert("更新成功");
                window.location.href = 'index.html';
            }
        }
    })
    
}

function GetCurrentDate()
{
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth() + 1; //January is 0!
    var yyyy = today.getFullYear();

    if (dd < 10) {
        dd = '0' + dd
    }

    if (mm < 10) {
        mm = '0' + mm
    }

    today = mm + '/' + dd + '/' + yyyy;
    return today;
}

database.ref('voting').on('value', function (snapshot) {
    snapshot.forEach(function (data) {
        UpdateNum(HttpGet("votename"));
    })
});
// Vote("高雄市市長選舉", 1);