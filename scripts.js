import { database, ref, dbRef, get, push, set, update } from "./firebase.js";

// const setEx = () => {
//     const childRef = ref(database);
//     const exToPush = {exercises};
//     return set(childRef, exToPush);
// }
// setEx();

// const setWorkout = () => {
//     const childRef = ref(database, 'exercises/');
//     return update(childRef, test);
//     console.log(childRef)
//     const test = {
//         'tester' : '50'
//     };
// }
// setWorkout();

let mainList = {};
let pumperUID;
let exercises = {};

const loadWorkoutData = () => {
    get(dbRef).then((snapshot) => {
        if(snapshot.exists()){
            mainList = snapshot.val();
            exercises = mainList.exercises;
            delete mainList.exercises;
            const pumperList = document.querySelector(`.pumperList`);
            if (mainList !== null) {
                for (let pumper in mainList) {
                    const nameAndID = {};
                    nameAndID.name = mainList[pumper].name;
                    nameAndID.id = pumper;
                    const pumperInList = document.createElement(`li`);
                    pumperInList.innerText = nameAndID.name;
                    pumperInList.id = nameAndID.id;
                    pumperInList.addEventListener(`click`, e => loadWorkout(e.target.id));
                    pumperList.appendChild(pumperInList)
                }  
            } else {
                document.querySelector(`.noPumpers`).classList.remove(`hidden`);
            }
        } else {
            document.querySelector(`.noPumpers`).classList.remove(`hidden`);
            console.log("No data available")
        }
    })
}

const addNewPumper = name => {
    const pumperData = {};
    pumperData.name = name;
    const newPostRef = push(dbRef, pumperData);
    mainList[newPostRef.key] = {};
    mainList[newPostRef.key].name = name;
    mainList[newPostRef.key].bodyWeight = '';
    loadWorkout(newPostRef.key);
}

const loadWorkout = pumperID => {
    const dataRows = document.querySelectorAll(`.dataRow`);
    dataRows.forEach(row => row.remove());
    const workoutInfo = mainList[pumperID];
    pumperUID = pumperID;
    document.querySelector(`.pumpLogin`).style.display = `none`;
    document.querySelector(`.pumpTracker`).style.display = `block`;
    document.getElementById(`pumper`).innerText = workoutInfo.name[0];
    document.querySelector(`.saveWorkout`).fbid = pumperID;
    document.getElementById(`bodyWeight`).value = workoutInfo.bodyWeight;
    if (workoutInfo.exercises === undefined) {
        addRow();
    } else {
        // load enough dataRows to fit all exercises; get length of exercises array and run add row for the amount of times needed
        for (let i = 0; i < workoutInfo.exercises.length; i++) addRow();
        // load input boxes with exercises sets and reps
        const allExercises = document.querySelectorAll(`.exercise`);
        const allSets = document.querySelectorAll(`.set`);
        const allReps = document.querySelectorAll(`.rep`);
        allExercises.forEach((exercise, index) => exercise.value = workoutInfo.exercises[index]);
        allSets.forEach((set, index) => set.value = workoutInfo.sets[index]);
        allReps.forEach((rep, index) => rep.value = workoutInfo.reps[index]);
    }
}

const saveWorkout = pumperID => {
    document.querySelector(`body`).classList.add(`savedWorkout`);
    const workoutToSave = mainList[pumperID];
    const exercises = [], sets = [], reps = [];
    let bodyWeight = document.getElementById(`bodyWeight`).value;
    if (bodyWeight == null || bodyWeight == '') {
        bodyWeight = ~~prompt(`What is your current body weight?`);
        document.getElementById(`bodyWeight`).value = bodyWeight;
    }
    const allExercises = document.querySelectorAll(`.exercise`);
    const allSets = document.querySelectorAll(`.set`);
    const allReps = document.querySelectorAll(`.rep`);
    allExercises.forEach(exercise => exercises.push(exercise.value));
    allSets.forEach(set => sets.push(set.value));
    allReps.forEach(rep => reps.push(rep.value));
    setTimeout(() => {
        document.querySelector(`body`).classList.remove(`savedWorkout`);
    }, 1000)
    if (workoutToSave.exercises == undefined) {
        // set workoutToSave
        workoutToSave.bodyWeight = ~~bodyWeight;
        workoutToSave.exercises = exercises;
        workoutToSave.sets = sets;
        workoutToSave.reps = reps;
        return set(ref(database, pumperID), workoutToSave);
    } else {
        // update workoutToSave
        workoutToSave.bodyWeight = ~~bodyWeight;
        workoutToSave.exercises = exercises;
        workoutToSave.sets = sets;
        workoutToSave.reps = reps;
        const updateRef = ref(database, pumperID)
        return update(updateRef, workoutToSave);
    }
}

const getWorkoutOptions = () => {
    let options = ``;
    for (let exercise in exercises) options = options + `<option value="${exercise}">${exercise} </option>`;
    return options;
}

const addRow = () => {
    const totalRows = document.querySelectorAll('.dataRow').length;
    const currentRowList = document.querySelectorAll('.dataRow');
    const newRow = document.createElement('div');
    newRow.classList.add(`repsRow`,`dataRow`,`row${totalRows}`);
    // <input type="text" id="exercise${totalRows}" class="exercise" placeholder="exercise">
    newRow.innerHTML = `
        <select name="exercise${totalRows}" id="exercise${totalRows}" class="exercise">
            ${getWorkoutOptions()}
        </select>
        <input type="text" id="sets${totalRows}" class="inputNumber set" placeholder="sets">
        <div>X</div>
        <input type="text" id="reps${totalRows}" class="inputNumber rep" placeholder="reps">
        <div class="completedSet completedSet${totalRows}">✅</div>
        <div class="weightInTotal weightInTotal${totalRows}"></div>
        <div class="removeSet removeSet${totalRows}">❌</div>
    `;
    if (totalRows === 0) {
        const headerRow = document.querySelector(`.header`);
        headerRow.after(newRow);
    } else {
        const lastRow = currentRowList[currentRowList.length - 1];
        lastRow.after(newRow);
    }
    document.querySelector(`.completedSet${totalRows}`).addEventListener('click', e => getRowAndExercise(e));
    document.querySelector(`.removeSet${totalRows}`).addEventListener('click', e => getRowForRemoval(e));
    document.getElementById(`sets${totalRows}`).addEventListener(`click`, e => e.target.value = ``);
    document.getElementById(`reps${totalRows}`).addEventListener(`click`, e => e.target.value = ``);
}

const getRowForRemoval = e => {
    const rowID = e.target.parentElement.classList[2];
    const rowNumber = rowID[rowID.length -1];
    removeRow(e, e.target.parentElement,rowNumber)
}

const removeRow = (e, row) => {
    e.stopImmediatePropagation();
    const removedRow = row.classList[2];
    const rowNumber = ~~removedRow[removedRow.length - 1];
    row.classList.add('removeRow');
    setTimeout(() => { 
        row.remove();
        const completeTable = document.querySelector(`.pumpTable`);
        const allTableItems = completeTable.querySelectorAll(`*`);
        allTableItems.forEach(item => {
            if (item.id && ~~item.id[item.id.length - 1] > rowNumber) {
                item.id = item.id.replace(~~item.id[item.id.length - 1], ~~item.id[item.id.length - 1] - 1);
            }
            if (item.name && ~~item.name[item.name.length - 1] > rowNumber) {
                item.name = item.name.replace(~~item.name[item.name.length - 1], ~~item.name[item.name.length - 1] - 1);
            }
            if (item.classList[item.classList.length - 1] && ~~item.classList[item.classList.length-1].at(-1) > rowNumber) {
                let lastClass = item.classList[item.classList.length - 1];
                lastClass = lastClass.replace( ~~lastClass.at(-1), ~~lastClass.at(-1) - 1);
                item.classList.replace(item.classList[item.classList.length - 1], lastClass)
            }
        })
        checkWorkoutComplete();
    }, 500)
}

const getRowAndExercise = e => {
    const rowID = e.target.parentElement.classList[2];
    const rowNumber = rowID[rowID.length -1];
    const exerciseName = document.getElementById(`exercise${rowNumber}`).value;
    completeSet(rowNumber, exerciseName);
}

const completeSet = (rowNumber, exerciseName) => {
    const exerciseInfo = exercises[exerciseName];
    let weightInSet;
    if (exerciseInfo.percentage == 1) {
        weightInSet = ~~prompt(exerciseInfo.addlText);
    } else {
        weightInSet = document.getElementById(`bodyWeight`).value;
        if (weightInSet == null || weightInSet == '') {
            weightInSet = ~~prompt(`What is your current body weight?`);
            document.getElementById(`bodyWeight`).value = weightInSet;
        }
    }
    if (weightInSet !== 0) {
        const setsNumber = ~~document.getElementById(`sets${rowNumber}`).value;
        const repsNumber = ~~document.getElementById(`reps${rowNumber}`).value;
        const totalWeight = Math.round(setsNumber * repsNumber * (weightInSet * exerciseInfo.percentage));
        document.querySelector(`.weightInTotal${rowNumber}`).innerText = totalWeight;
        const rowInputs = document.querySelectorAll(`.row${rowNumber} input`);
        rowInputs.forEach(box => box.classList.add('setComplete'));
        const rowSelects = document.querySelectorAll(`.row${rowNumber} select`);
        rowSelects.forEach(box => box.classList.add('setComplete'));
        checkWorkoutComplete();
    }
}

const checkWorkoutComplete = () => {
    const allInputBoxes = document.querySelectorAll(`.pumpTable input`);
    let counter = 0;
    allInputBoxes.forEach(box => { 
        const boxClasses = [...box.classList];
        if (boxClasses.includes(`setComplete`)) counter++; 
    });
    if (counter === allInputBoxes.length) {
        let weightTotal = 0;
        const weightBoxes = document.querySelectorAll(`.weightInTotal`);
        weightBoxes.forEach(box => weightTotal = weightTotal + ~~box.innerText);
        setTimeout(() => { displayResults(weightTotal) }, 1000);
    }
}

const displayResults = weightTotal => {
    const workoutInfo = mainList[pumperUID];
    document.querySelector('.weightLiftedModal').style.display = 'flex';
    document.getElementById('exclamation').innerText = exclamations[Math.floor(Math.random() * exclamations.length)];
    document.getElementById('pumperName').innerText = workoutInfo.name;
    document.getElementById('weightLiftedTotal').innerText = Math.round(weightTotal);
    const itemToWeigh = Math.floor(Math.random() * itemsToWeigh.length);
    const weighedItem = Object.values(itemsToWeigh[itemToWeigh])
    const weightEquivalent = Math.round(weightTotal / weighedItem)
    document.getElementById('weightEquivalent').innerText = weightEquivalent;
    document.getElementById('itemToMeasureWith').innerText = Object.keys(itemsToWeigh[itemToWeigh]);
    document.querySelector(`.pumpComparison`).innerText = `${pumpComparison(workoutInfo.previousPump, weightTotal)}`;
    const workoutToSave = {};
    workoutToSave.previousPump = weightTotal;
    workoutToSave.weightAndDate = recordWeightAndDate(workoutInfo, weightTotal);
    const previousTotal = workoutInfo.weightToDate; 
    if (previousTotal == undefined || previousTotal == null) {
        workoutToSave.weightToDate = weightTotal;
    } else {
        workoutToSave.weightToDate = previousTotal + weightTotal;
    }
    mainList[pumperUID] = workoutInfo;
    document.getElementById('weightToDate').innerText = Math.round(workoutToSave.weightToDate);
    loadYearlyProgress(mainList[pumperUID]);
    const updateRef = ref(database, pumperUID)
    return update(updateRef, workoutToSave);
}

const recordWeightAndDate = (workoutInfo, weightTotal) => {
    const date = new Date().toDateString();
    const weightAndDate = {};
    weightAndDate[date] = weightTotal;
    if (workoutInfo.weightAndDate == undefined || workoutInfo.previousPump == null) {
        workoutInfo.weightAndDate = [weightAndDate];
    } else {
        workoutInfo.weightAndDate.push(weightAndDate);
    }
    return workoutInfo.weightAndDate;
}

const pumpComparison = (previousPump, currentPump) => {
    if (previousPump < currentPump) {
        return `You pumped more than you did last sesh, too. Get those gains!`;
    } else if (previousPump > currentPump) {
        return `You pumped a bit less than last time, but that's alright. You're poised to pump up next time!`;
    } else {
        return ``;
    }
}

const addNewExercise = () => {
    const exerciseToSave = {};
    exerciseToSave.name = document.getElementById(`newExerciseName`).value;
    const exerciseType = document.querySelector(`input[name="weightType"]:checked`).value;
    if (exerciseType == 'body') {
        const bodyWeightPercent = document.getElementById(`bodyWeightPercent`).value;
        exerciseToSave.percentage = Number(`0.${bodyWeightPercent}`);
        exerciseToSave.addlText = 'What is your body weight?';
    } else if (exerciseType == 'free') {
        exerciseToSave.percentage = 1;
        exerciseToSave.addlText = 'How much weight you liftin?';
    }
    // add exercise to selects
    addExerciseToSelects(exerciseToSave.name);

    // show save state
    document.querySelector(`.addExercise`).classList.add(`savedWorkout`);
    setTimeout(() => {
        document.querySelector(`.addExercise`).classList.remove(`savedWorkout`);
    }, 1000)
    document.getElementById(`newExerciseName`).value = '';
    document.getElementById(`bodyWeightPercent`).value = '';
    const exToPush = {};
    exToPush[exerciseToSave.name] = {
        'name' : exerciseToSave.name,
        'percentage' : exerciseToSave.percentage,
        'addlText' : exerciseToSave.addlText
    }
    // store in local to use right away
    exercises[exerciseToSave.name] = exToPush[exerciseToSave.name];
    // store in firebase
    const childRef = ref(database, 'exercises/');
    return update(childRef, exToPush);
}

const addExerciseToSelects = newExerciseName => {
    const newOption = document.createElement(`option`);
    newOption.value, newOption.text = newExerciseName;
    const allSelects = document.querySelectorAll(`select`);
    allSelects.forEach(select => select.add(newOption));
}

const resetWorkout = () => {
    const rowInputs = document.querySelectorAll(`input`);
    rowInputs.forEach(box => box.classList.remove('setComplete'));
    const rowSelects = document.querySelectorAll(`select`);
    rowSelects.forEach(box => box.classList.remove('setComplete'));
    const weightTotals = document.querySelectorAll(`.weightInTotal`);
    weightTotals.forEach(box => box.innerText = ``);
    // need to readd any removed workouts into list
}

const loadYearlyProgress = pumper => {
    const dateBars = document.querySelectorAll(`.dateBar`);
    dateBars.forEach(bar => bar.remove());
    const findPB = [];
    pumper.weightAndDate.forEach((entry, index) => {
        const date = Object.keys(entry)[0];
        findPB.push(entry[date]);
        let weight = String(entry[date]);
        const dateBar = document.createElement(`div`);
        const weightSpot = document.createElement(`div`);
        dateBar.classList.add(`dateBar`, `date${index}`);
        dateBar.innerHTML = `<span>${date.slice(3,7)}<br>${date.slice(8,-5)}</span>`;
        weightSpot.classList.add(`weightSpot`);
        weightSpot.innerText = weight;
        weightSpot.style.height = `${~~weight / 100}px`;
        for (let i = weight.length; i < 6; i++) weight = `D${weight}`
        weightSpot.style.background = `#${weight}`;
        dateBar.appendChild(weightSpot);
        document.querySelector(`.graph`).appendChild(dateBar);
    })
    const personalBest = findPB.indexOf(Math.max(...findPB));
    const pbDiv = document.createElement(`span`);
    pbDiv.classList.add(`pb`);
    pbDiv.innerHTML = `💪🏼`;
    document.querySelector(`.date${personalBest}`).appendChild(pbDiv);
}

//radio button event listeners
const freeWeightButton = document.getElementById(`free`);
freeWeightButton.addEventListener(`change`, () => {
    if (freeWeightButton.checked) document.getElementById(`bodyWeightPercent`).disabled = true;
})
const bodyWeightButton = document.getElementById(`body`);
bodyWeightButton.addEventListener(`change`, () => {
    if (bodyWeightButton.checked) document.getElementById(`bodyWeightPercent`).disabled = false;
})

// mainstay button event listeners
document.querySelector(`.addNewPumper`).addEventListener(`click`, () => {
    const newPumperName = document.getElementById(`newPumperName`).value;
    addNewPumper(newPumperName);
});
document.querySelector('.addRow').addEventListener('click', () => addRow());
document.querySelector('.reset').addEventListener('click', () => resetWorkout());
document.querySelector(`.saveWorkout`).addEventListener(`click`, e => saveWorkout(e.target.fbid));
document.querySelector(`.addExerciseButton`).addEventListener(`click`, () => addNewExercise());
document.querySelector(`.closeModal`).addEventListener(`click`, () => {
    resetWorkout();
    loadWorkout(pumperUID);
    document.querySelector(`.weightLiftedModal`).style.display = `none`;
});
document.querySelector(`.viewProgress`).addEventListener(`click`, () => {
    document.querySelector(`.weightLiftedModal`).style.display = 'none';
    document.querySelector(`.yearlyTotals`).style.display = 'flex';
})
document.querySelector(`.closeProgress`).addEventListener(`click`, () => {
    resetWorkout();
    loadWorkout(pumperUID);
    document.querySelector(`.yearlyTotals`).style.display = `none`;
});

loadWorkoutData();