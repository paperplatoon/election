

  // ------------------------------------------------------------------------------------------------------------------------------------------------------------
  // --------------------------------------------------------------- CARD FUNCTIONS -------------------------------------------------------------------
  // ------------------------------------------------------------------------------------------------------------------------------------------------------------

  state = {
    encounterDraw: [],
    encounterDiscard: [],
    encounterHand: [],
    playerMoney: 0,
    playerVolunteers: 0,
    playerSupport: 0,
    playerBusiness: 0,
    fullDeck: [],
    status: "Normal", // Added status property
    possibleCardPool: [], // Will be populated later
  };

  function shuffleDiscardIntoDeck(stateObj) {
    stateObj = immer.produce(stateObj, (newState) => {
      newState.encounterDraw = [...newState.encounterDiscard];
      newState.encounterDiscard = [];
      newState.encounterDraw = fisherYatesShuffle(newState.encounterDraw);
    })
    
    return stateObj;
  }

  function fisherYatesShuffle(arrayObj) {
    let arrayCopy = [...arrayObj];
    for (let x = arrayCopy.length-1; x > 0; x--) { 
      let y = Math.floor(Math.random() * (x+1)); 
      let temp = arrayCopy[x] 
      arrayCopy[x] = arrayCopy[y] 
      arrayCopy[y] = temp 
   } 
   return arrayCopy;
  }

  function pause(timeValue) {
    return new Promise(res => setTimeout(res, timeValue))
  }


  async function drawACard(stateObj, handDraw = true) {
    let topCard = false;

    stateObj = immer.produce(stateObj, (newState) => {
  
      // if deck is empty, shuffle discard and change newState to reflect that
      if (newState.encounterDraw.length === 0) {
        Object.assign(newState, shuffleDiscardIntoDeck(newState));
      }
  
      topCard = newState.encounterDraw.shift();
      if (!topCard) {
        return newState;
      }
  
      newState.encounterHand.push(topCard);
    })
    return stateObj;
  }


  async function playACard(stateObj, cardIndexInHand) {
    const cardObj = stateObj.encounterHand[cardIndexInHand];
    if (!cardObj || !cardObj.canPlay(stateObj, cardObj)) {
      console.log("Cannot play this card");
      return stateObj;
    }
  
    console.log("You played " + cardObj.name);
    stateObj = await cardObj.action(stateObj, cardObj);
  
    stateObj = immer.produce(stateObj, (newState) => {
      const [playedCard] = newState.encounterHand.splice(cardIndexInHand, 1);
      newState.encounterDiscard.push(playedCard);
    });
    await updateState(stateObj)
    return stateObj
  }

  async function endTurn() {
    stateObj = {...state}
    // Move all cards from encounterHand to encounterDiscard
    stateObj = immer.produce(stateObj, (newState) => {
      newState.encounterDiscard.push(...newState.encounterHand);
      newState.encounterHand = [];
    });
  
    // Draw 5 new cards
    for (let i = 0; i < 5; i++) {
        stateObj = await drawACard(stateObj);
    }
  
    // Update the hand display and player stats
    await updateState(stateObj);
  }

  // --------------------------------------
// State Modification Functions
// --------------------------------------
function gainVolunteer(stateObj, amount) {
    return immer.produce(stateObj, (newState) => {
      newState.playerVolunteers += amount;
    });
  }
  
  function gainSupport(stateObj, amount) {
    return immer.produce(stateObj, (newState) => {
        if (amount < 0 && (stateObj.playerSupport + amount) < 0) {
            newState.playerSupport = 0
        } else {
            newState.playerSupport += amount;
        }
    });
  }
  
  function gainBusiness(stateObj, amount) {
    return immer.produce(stateObj, (newState) => {
      newState.playerBusiness += amount;
    });
  }
  
  function gainMoney(stateObj, amount) {
    return immer.produce(stateObj, (newState) => {
      newState.playerMoney += amount;
    });
  }
  
  function payMoney(stateObj, amount) {
    return immer.produce(stateObj, (newState) => {
      newState.playerMoney -= amount;
    });
  }

  function setStatus(stateObj, status) {
    return immer.produce(stateObj, (newState) => {
      newState.status = status;
    });
  }

  

  // ====== ====== ====== ====== ====== ====== ====== ====== ====== ====== ====== ====== ====== ====== ====== ====== ====== 
// ====== ====== ====== ====== ====== RENDERING CARDS AND CARD PILES ====== ====== ====== ====== ====== ====== 
// ====== ====== ====== ====== ====== ====== ====== ====== ====== ====== ====== ====== ====== ====== ====== ====== ====== 

  function createHandDiv(stateObj) {
    handDivArray = []
    if (stateObj.encounterHand.length > 0) {
      stateObj.encounterHand.forEach(function (cardObj, index) {
        let newCard = renderHandCard(stateObj, cardObj, index);
        handDivArray.push(newCard)
      });
    }

    newHandDiv = createGenericDiv(['handContainer'])

    if (handDivArray.length > 0) {
        for (i=0; i < handDivArray.length; i++) {
            newHandDiv.append(handDivArray[i])
        }
    }

    return newHandDiv
  }

  function createAvatarDiv(cardObj) {
    const avatarDiv = document.createElement("div");
    avatarDiv.classList.add("card-avatar-div");

    const avatarImg = document.createElement("img");
    avatarImg.classList.add('card-avatar-img')
    avatarImg.src = cardObj.imagePath;

    avatarDiv.append(avatarImg)

    return avatarDiv
    
    
  }

  function renderCardDisplay(cardObj, canPlay=true) {
    const cardDiv = document.createElement("div");
    cardDiv.classList.add("card");

    const cardHeaderDiv = createGenericDiv(['card-name-div'])
    const cardHeader = createGenericText(cardObj.name, "card-name-text")
    if (canPlay) {
        cardHeader.classList.add(cardObj.cardType)
    } else {
        console.log('card cannot be played')
        cardHeader.classList.add("disabled")
    }
    cardHeaderDiv.append(cardHeader)

    avatarDiv = createAvatarDiv(cardObj)


    const cardTextDiv = createGenericDiv(['card-text-div'])
    const cardText = createGenericText(cardObj.text, "card-text")
    cardTextDiv.append(cardText)

    cardDiv.append(cardHeaderDiv, avatarDiv, cardTextDiv)

    return cardDiv
  }
  
  function renderHandCard(stateObj, cardObj, index) {
    let cardDiv = renderCardDisplay(cardObj, true)

    if (cardObj.canPlay(stateObj, cardObj)) {
        cardDiv = renderCardDisplay(cardObj, true)
        cardDiv.addEventListener("click", async () => {
            await playACard(stateObj, index);
        });
    } else {
        cardDiv = renderCardDisplay(cardObj, false)
    }
    return cardDiv
  }

  function renderScreen(stateObj) {
    let appDiv = document.getElementById("app");
    appDiv.innerHTML = "";
  
    if (stateObj.status === "ChoosingNewCard") {
      renderChooseNewCard(stateObj);
    } else {
      // Default rendering for the normal game state
      renderBasicScreen(stateObj)
    }
  }

  function renderBasicScreen(stateObj) {
    let appDiv = document.getElementById("app");
    appDiv.innerHTML = "";

    let statsDiv = createGameStatsDiv(stateObj);
    appDiv.append(statsDiv);

    let handDiv = createHandDiv(stateObj);
    appDiv.append(handDiv);

    let buttonDiv = createEndTurnButton();
    appDiv.append(buttonDiv);

  }

  function renderChooseNewCard(stateObj) {
    let appDiv = document.getElementById("app");
    appDiv.innerHTML = "";
  
    let chooseCardDiv = createGenericDiv(["choose-card-container"]);
    let instructionText = createGenericText("Choose a card to add to your deck:");
    chooseCardDiv.appendChild(instructionText);
  
    // Randomly select 3 unique cards from possibleCardPool
    let randomCards = getRandomCards(stateObj.possibleCardPool, 3);
  
    randomCards.forEach((cardObj) => {
      let cardDiv = renderSelectableCard(stateObj, cardObj);
      chooseCardDiv.appendChild(cardDiv);
    });
  
    appDiv.appendChild(chooseCardDiv);

    let skipButton = createGenericDiv(["skip-button"]);
    let skipText = createGenericText("Skip")
    skipButton.append(skipText)
    skipButton.addEventListener("click", async () => {
        // Add the selected card to the encounterDiscard
        stateObj = setStatus(stateObj, "Normal")
    
        // Update the state and re-render
        await updateState(stateObj);
      });

      appDiv.append(skipButton)
  }

  function getRandomCards(cardPool, numCards) {
    let shuffled = fisherYatesShuffle([...cardPool]);
    return shuffled.slice(0, numCards);
  }

  function renderSelectableCard(stateObj, cardObj) {
    const cardDiv = renderCardDisplay(cardObj)
    cardDiv.addEventListener("click", async () => {
        //when chosen card gets added to deck
      stateObj = immer.produce(stateObj, (newState) => {
        newState.encounterDiscard.push(cardObj);
        newState.fullDeck.push(cardObj)
        newState.status = "Normal";
      });
      await updateState(stateObj);
    });
  
    return cardDiv;
  }
  

  function createGameStatsDiv(stateObj) {
    moneyDiv = createStatDiv("Money: " + stateObj.playerMoney, ["stats-money"]);
    supportDiv = createStatDiv("Support: " + stateObj.playerSupport, ["stats-support"]);
    businessDiv = createStatDiv("Business: " + stateObj.playerBusiness, ["stats-business"]);
    volunteerDiv = createStatDiv("Support: " + stateObj.playerVolunteers, ["stats-volunteer"]);

    statsDiv = createGenericDiv(["stats-holder-div"])
    statsDiv.append(moneyDiv, supportDiv, businessDiv, volunteerDiv)
    return statsDiv
    
  }


  function createGenericDiv(className=false) {
    const newDiv = document.createElement("div");
    if (className) {
        for (i=0; i < className.length; i++) {
            newDiv.classList.add(className[i])
        }
    }
    return newDiv
  }

  function createGenericText(textString, className=false) {
    const newP = document.createElement("p");
    newP.textContent = textString

    if (className) {
        for (classN in className) {
            newP.classList.add(classN)
        }
    }
    return newP
  }

  function createStatDiv(divText, className=false) {
    const newDiv = document.createElement("div");
    newDiv.innerHTML = `
      <h3>${divText} </h3>
    `;
    if (className) {
        for (classN in className) {
            newDiv.classList.add(classN)
        }
    }

    return newDiv
  }

  function createEndTurnButton() {
    const buttonDiv = createGenericDiv(['end-turn-button-div']);
    buttonText = createGenericText("End Week", ['end-turn-button-text'])
    buttonDiv.addEventListener('click', endTurn);
    buttonDiv.append(buttonText)
    return buttonDiv
  }


  //---------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  //---------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  //--------------------------------------------------------------------- begin game ----------------------------------------------------------------------------
  //---------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  //---------------------------------------------------------------------------------------------------------------------------------------------------------------------------

 async function setupEncounter(stateObj) {
    stateObj = immer.produce(stateObj, (newState) => {
      tempDeck = [...newState.fullDeck];
      newState.encounterDiscard = [];
      newState.encounterHand = [];
      newState.playerMoney = 0;
      newState.playerVolunteers = 0;
      newState.playerSupport = 0;
      newState.playerBusiness = 0;
      newState.encounterDraw = fisherYatesShuffle(tempDeck);
    });

  for (let i = 0; i < 5; i++) {
    stateObj = await drawACard(stateObj);
  }

  updateState(stateObj)
  renderScreen(stateObj)

  return stateObj;
}

async function updateState(stateObj) {
    state = {...stateObj}
    renderScreen(stateObj)
}


  //---------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  //---------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  //--------------------------------------------------------------------- Cards ----------------------------------------------------------------------------
  //---------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  //---------------------------------------------------------------------------------------------------------------------------------------------------------------------------


basicMoneyOne = {
    name: "Email Blast",
    text: "Gain $100. Gain 1 Volunteer",
    cardType: "gain-money",
    imagePath: "img/email.png",
    pickAttack: true,
    moneyAmount: 100,
    volunteerAmount: 1,
    canPlay: () => {
      return true
    },
    action: async (stateObj, cardObj) => {
        stateObj = await gainMoney(stateObj, cardObj.moneyAmount)
        stateObj = await gainVolunteer(stateObj, cardObj.volunteerAmount)
        await updateState(stateObj);
        return stateObj
      }
      
}

basicMoneyTwo = {
    name: "Donation Plea",
    text: "Gain $200. Gain 1 Support",
    cardType: "gain-money",
    imagePath: "img/donation.png",
    pickAttack: true,
    moneyAmount: 200,
    supportAmount: 1,
    canPlay: () => {
      return true
    },
    action: async (stateObj, cardObj) => {
        stateObj = await gainMoney(stateObj, cardObj.moneyAmount)
        stateObj = await gainSupport(stateObj, cardObj.supportAmount)
        await updateState(stateObj);
        return stateObj
      }
      
}

basicMoneyThree = {
    name: "Fundraising Dinner",
    text: "Gain $300",
    cardType: "gain-money",
    imagePath: "img/fundraising.png",
    pickAttack: true,
    moneyAmount: 300,
    canPlay: () => {
      return true
    },
    action: async (stateObj, cardObj) => {
        stateObj = await gainMoney(stateObj, cardObj.moneyAmount)
        await updateState(stateObj);
        return stateObj
      }
      
}

basicMoneyFour = {
    name: "Backroom Meeting",
    text: "Gain $500. Gain 1 Business. Lose 1 Support",
    cardType: "gain-money",
    imagePath: "img/backroom.png",
    pickAttack: true,
    moneyAmount: 500,
    supportAmount: -1,
    businessAmount: 1,
    canPlay: () => {
      return true
    },
    action: async (stateObj, cardObj) => {
        stateObj = await gainMoney(stateObj, cardObj.moneyAmount)
        stateObj = await gainSupport(stateObj, cardObj.supportAmount)
        stateObj = await gainBusiness(stateObj, cardObj.businessAmount)
        await updateState(stateObj);
        return stateObj
      }
      
}

buySupportCard = {
    name: "Hold Rally",
    text: "Pay $1000. Gain 5 support",
    cardType: "pay-money",
    imagePath: "img/email.png",
    pickAttack: true,
    moneyCost: 1000,
    supportAmount: 5,
    canPlay: (stateObj, cardObj) => stateObj.playerMoney >= cardObj.moneyCost,
    action: async (stateObj, cardObj) => {
        stateObj = await payMoney(stateObj, cardObj.moneyCost)
        stateObj = await gainSupport(stateObj, cardObj.supportAmount)
        await updateState(stateObj);
        return stateObj
      }
      
}

const buyBusinessCard = {
    name: "Backroom Deal",
    text: "Pay $1000. Gain 5 Business.",
    cardType: "pay-money",
    imagePath: "img/email.png",
    moneyCost: 1000,
    businessAmount: 5,
    canPlay: (stateObj, cardObj) => stateObj.playerMoney >= cardObj.moneyCost,
    action: async (stateObj, cardObj) => {
      stateObj = payMoney(stateObj, cardObj.moneyCost);
      stateObj = gainBusiness(stateObj, cardObj.businessAmount);
      await updateState(stateObj);
      return stateObj;
    },
  };

  const buyNewCard = {
    name: "Hiring Call",
    text: "Pay $500. Choose a card to add to your deck.",
    cardType: "pay-money",
    imagePath: "img/email.png",
    moneyCost: 500,
    canPlay: (stateObj, cardObj) => stateObj.playerMoney >= cardObj.moneyCost,
    action: async (stateObj, cardObj) => {
      stateObj = await payMoney(stateObj, cardObj.moneyCost);
      stateObj = immer.produce(stateObj, (newState) => {
        newState.status = "ChoosingNewCard";
      });
      await updateState(stateObj);
      return stateObj;
    },
  };




  //----------------------------------------------------------------------------------------------------------------------------------
    //----------------------------------------------------------------------------------------------------------------------------------
      //----------------------------------------------------------------------------------------------------------------------------------
        //----------------------------------------------------------STATE FUNCTIONS--------------------------------------------------------

  state.fullDeck = [
    basicMoneyOne,
    basicMoneyTwo,
    basicMoneyTwo,
    basicMoneyThree,
    basicMoneyThree,
    basicMoneyFour,
    buySupportCard,
    buyBusinessCard,
    buyNewCard,
  ];


  state.possibleCardPool = [
    basicMoneyOne,
    basicMoneyTwo,
    basicMoneyThree,
    basicMoneyFour,
    buySupportCard,
    buyBusinessCard,
    // Add any other cards you want
  ];

  state = setupEncounter(state);