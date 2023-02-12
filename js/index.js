// Loader
const loader = document.querySelector('#loading');
const main = document.getElementsByTagName('main')[0];

const progress_bar = document.getElementById('progress_bar');

let questionsData; // Questions array
let qIndex = -1; // Current question
let voted = false; // Preventing voting twice flag
const resultsAnimationSpeed = 5;

const displayLoading = () => {
    loader.classList.add('display');
    main.style.visibility = 'hidden';
};

const hideLoading = () => {
    loader.classList.remove('display');
    main.style.visibility = 'visible';
};

const getQuestionsData = async () => {
    // Get all questions data from AWS DynamoDB service
    return fetch('https://p60d6kvqpc.execute-api.us-east-1.amazonaws.com/v1/questions', {
        method: 'GET',
    })
        .then((res) => res.json())
        .then((data) => {
            setTimeout(() => {
                hideLoading();
            }, 300);
            progress_bar.max = data?.length;
            return data;
        })
        .catch((error) => {
            console.error(error);
        });
};

const showResultsAnimation = (i, endNum, element, rest) => {
    element.innerText = i + '%';
    if (i < endNum)
        setTimeout(() => {
            showResultsAnimation(i + 1, endNum, element, rest);
        }, resultsAnimationSpeed);
    else element.innerText = i + rest + '%';
};

const voteQuestion = async (option) => {
    // Vote for option (= 1/2)
    if (!voted)
        await fetch(`https://p60d6kvqpc.execute-api.us-east-1.amazonaws.com/v2/vote/${qIndex}`, {
            method: 'POST',
            body: JSON.stringify({
                option: option,
            }),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        })
            .catch((error) => {
                console.error(error);
                return;
            })
            .finally(() => {
                voted = true; // Disable voting
                option == 1 ? questionsData[qIndex].option1_votes.N++ : questionsData[qIndex].option2_votes.N++;
                // Show all stats
                const option1_votes = Number(questionsData[qIndex].option1_votes.N);
                const option2_votes = Number(questionsData[qIndex].option2_votes.N);
                const total_votes = option1_votes + option2_votes;
                const percentage1 = option1_votes > 0 ? parseFloat((option1_votes / total_votes) * 100).toFixed(2) : 0;
                const percentage2 = option2_votes > 0 ? parseFloat((option2_votes / total_votes) * 100).toFixed(2) : 0;
                showResultsAnimation(
                    1,
                    Math.floor(percentage1),
                    document.getElementById('votes1'),
                    Math.floor(percentage1) - percentage1
                );
                showResultsAnimation(
                    1,
                    Math.floor(percentage2),
                    document.getElementById('votes2'),
                    Math.floor(percentage2) - percentage2
                );
                document.getElementById('total_votes').innerText = 'Total Votes: ' + total_votes;
                document.getElementById('next').style.visibility = 'visible';
            });
};

const getNextQuestion = () => {
    qIndex++;
    voted = false;
    document.getElementById('next').style.visibility = 'hidden';
    document.getElementById('votes1').innerText = '';
    document.getElementById('votes2').innerText = '';
    document.getElementById('total_votes').innerText = '';

    if (qIndex >= questionsData?.length) {
        alert('Out of questions, back to start');
        getQuestionsData();
        qIndex = 0;
    }

    progress_bar.value = qIndex + 1;
    document.getElementById('progress').innerText = qIndex + 1 + '/' + questionsData?.length;
    document.getElementById('option1').innerText = questionsData[qIndex].option1.S;
    document.getElementById('option2').innerText = questionsData[qIndex].option2.S;
};

window.onload = async () => {
    displayLoading();
    questionsData = await getQuestionsData();
    questionsData.sort((a, b) => a.id.N - b.id.N);
    console.log(questionsData ? 'Starting app at:\n' : 'Failed to starting app at:\n', Date('he-il'));
    console.log('Number of questions in DB:', questionsData?.length);
    getNextQuestion();
};
