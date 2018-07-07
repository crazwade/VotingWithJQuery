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

function SignUp(email, password)
{
    firebase.auth().createUserWithEmailAndPassword(email, password)
        .catch(function (error) {
            // Handle Errors here.
            var errorCode = error.code;
            var errorMessage = error.message;
            if (errorCode == 'auth/weak-password') {
                alert('The password is too weak.');
            } else {
                alert(errorMessage);
            }
            console.log(error);
        });
}

function Vote(VoteName, CandidateID, Voter) {
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
        VoteTo: CandidateID,
        Voter: "UserEmail"
    });
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
        console.log(data.val());
        // str += '<li>' + data.val().name + ":  " + data.val().message + '</li>'
        // talkArea.innerHTML = str;
    })
});

Vote("高雄市市長選舉", 1);