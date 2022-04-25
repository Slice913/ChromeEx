let addItemForm = document.querySelector('#addItemForm');
let itemsList = document.querySelector('.actionItems');
let storage = chrome.storage.sync; 
let actionItemsUtils = new ActionItems();

//chrome.storage.sync.clear();

// function get the data.
storage.get(['actionItems','name'], (data) => {
  let actionItems = data.actionItems;
  let name = data.name; 
  console.log(actionItems);
  setGreeting();
  setGreetingImage();
  setUsersName(name);
  createUpdateNameListener();
  greetingNameUpdateListener();
  createQuickActionListener();
  renderActionItems(actionItems);
  actionItemsUtils.setProgress();
  chrome.storage.onChanged.addListener(()=>{
    console.log('changed');
    actionItemsUtils.setProgress();
  })
});

const setUsersName = (name) => {
  let newName = name ? name : 'Add Name';
  document.querySelector('.name__value').innerText = newName;
}

const renderActionItems = (actionItems) => {
  // filter out action items here for yeresterday
  const filteredItems = filterActionItems(actionItems);
  
    filteredItems.forEach((item)=>{  
      renderActionItem(item.text, item.id, item.completed, item.website);
    })
    storage.set({
      actionItems: filteredItems
    })
}

const filterActionItems = (actionItems)=>{
  let currentDate = new Date(); // current time
  currentDate.setHours(0,0,0,0); // returns current time in  millisecs set to 12:00 of current day.
  const filteredItems = actionItems.filter((item)=>{
    if(item.completed) {
        const compeletedDate = new Date(item.compeleted);
        if(compeletedDate < currentDate){
          return false;
        }
       }
        return true;
    })
    return filteredItems;
 }

const greetingNameUpdateListener = () => {
  let greetingName = document.querySelector('.greeting__name');
  greetingName.addEventListener('click',()=>{
    //open the model
    storage.get(['name'], (data)=>{
      let name = data.name ? data.name : '';
      document.getElementById('inputName').value = name;
    })
    $('#updateNameModel').modal('show');
  }) // YOU did it congratulations! 
}




const handleUpdateName = () =>{
  // text box where name is entered
  const name = document.querySelector('#inputName').value;
  if(name) {
    // save named to chrome database
    actionItemsUtils.saveName(name, ()=>{
      // set the user's name of the front end
      setUsersName(name);
      $('#updateNameModel').modal('hide');
    })
  }
  
}

// listens for "Save changes" button click
 const createUpdateNameListener = () =>{
   let element = document.querySelector('#save_button');
   element.addEventListener('click', handleUpdateName); // pass handleUpdateName here
 } 


 

const handleQuickActionListener = (e) => {
  const text = e.target.getAttribute('data-text');
  const id = e.target.getAttribute('data-id');
  getCurrentTab().then((tab)=>{
    actionItemsUtils.addQuickActionItem(id, text, tab, (actionItem)=>{
      renderActionItem(actionItem.text, actionItem.id, actionItem.completed, actionItem.website, 250);
    });
  })
}

const createQuickActionListener = () => {
  let buttons = document.querySelectorAll('.quick-action');
  
  buttons.forEach((button)=>{
      button.addEventListener("click", handleQuickActionListener);
        
  })
  // console.log(buttons);
} 



const getCurrentTab =  async () => {
  return await new Promise((resolve, reject)=>{
    chrome.tabs.query({ 'active': true, 'windowId': chrome.windows.WINDOW_ID_CURRENT}, (tabs)=>{
      resolve(tabs[0]);
  })
  });
  // let [tab] = chrome.tabs.query(queryOptions);
}

addItemForm.addEventListener('submit', (e) => {
  e.preventDefault();
  let itemText = addItemForm.elements.namedItem('itemText').value; 
  if(itemText) {
    actionItemsUtils.add(itemText, null, (actionItem)=>{
      renderActionItem(actionItem.text, actionItem.id, actionItem.completed, actionItem.website, 250);
      addItemForm.elements.namedItem('itemText').value = '';
    });
  }
})

  


const handleCompletedEventListner = (e) => {
  const id = e.target.parentElement.parentElement.getAttribute('data-id');
  const parent = e.target.parentElement.parentElement;
 
  if(parent.classList.contains('completed')){
    actionItemsUtils.markUnmarkCompleted(id, null);
    parent.classList.remove('completed');
  } else {
    actionItemsUtils.markUnmarkCompleted(id, new Date().toString())
    parent.classList.add('completed');

  }

}

const handleDeleteEventListner = (e) => {
  const id = e.target.parentElement.parentElement.getAttribute('data-id');
  const parent = e.target.parentElement.parentElement; // targets the parents parent (whole action item)
  const jELement =  $(`div[data-id="${id}"]`);
  // remove form chrome storage
  actionItemsUtils.remove(id, ()=>{
    animateUp(jELement);
  });
  

}


const renderActionItem = (text , id, completed, website=null, animationDuration=450) => {
  // call function with text
  let element = document.createElement('div');
  element.classList.add('actionItem__item');
  let mainElement = document.createElement('div');
  mainElement.classList.add('actionItem__main');
  let checkEl = document.createElement('div');
  checkEl.classList.add('actionItem__check');
  let textEl = document.createElement('div');
  textEl.classList.add('actionItem__text');
  let deleteEl = document.createElement('div');
  deleteEl.classList.add('actionItem__delete');
  // let quickAction = documnt.getElementByClassName('')

  checkEl.innerHTML = `
    <div class="actionItem__checkBox">
      <i class="fas fa-check" aria-hidden="true"></i>
    </div>`;

  if(completed){
    element.classList.add('completed');
  }

  element.setAttribute('data-id', id);
  checkEl.addEventListener('click', handleCompletedEventListner);
  deleteEl.addEventListener('click', handleDeleteEventListner);
  // .addEventListener('click', handleQuickActionListener );
  textEl.textContent = text;
  deleteEl.innerHTML = `<i class="fas fa-times" aria-hidden="true"></i>`;
  mainElement.appendChild(checkEl);
  mainElement.appendChild(textEl);
  mainElement.appendChild(deleteEl);
  element.appendChild(mainElement);
  if(website){
    let linkContainer = createLinkContainer(website.url, website.fav_icon, website.title); 
    element.appendChild(linkContainer);
  }
  itemsList.prepend(element);
  let jElement = $(`div[data-id="${id}"]`);
  animateDown(jElement, animationDuration);

}

const animateUp = (element)=> { //! Start here TS-3:24
  let height = element.innerHeight();
  element.animate({ 
    opacity: '0',
    marginTop: `-${height}px`
  }, 250, () => {
    element.remove();
  })
}

const animateDown = (element, duration)=> {
  let height = element.innerHeight();
  element.css ({ marginTop: `-${height}px`, opacity: 0}).animate({ 
    opacity: 1,
    marginTop: '12px'
  }, duration);

}


const createLinkContainer = (url, favIcon, title) => {
  let element = document.createElement('div');
  element.classList.add('actionItem__linkContainer');
  element.innerHTML = `
    <a href="${url}" target="_blank">
        <div class="actionItem__link">
            <div class="actionItem__favIcon">
                <img src="${favIcon}" alt="">
            </div>
            <div class="actionItem__title">
              <span>${title}</span> 
            </div>
        </div>
      </a>
    `
  return element;
}

const setGreeting = () => {
  let greeting = 'Good ';
  const today = new Date();
  const hour = today.getHours();
  

  if(hour >= 5 && hour <= 11) {
    greeting += 'Morning,';
  } else if (hour >= 12 && hour <= 16) {
    greeting += 'Afternoon,';
  } else if (hour >= 17 && hour <= 20) {
    greeting += 'Evening,';
  } else {
    greeting += 'Night,';
  }
  document.querySelector('.greeting__type').innerText = greeting; 
}


const setGreetingImage = () => {
  // get the image src
  let image = document.getElementById('greeting__image');
  const today = new Date();
  const hour = today.getHours()

  if(hour >= 5 && hour <= 11) {
    image.src = './images/good-morning.png';
  } else if (hour >= 12 && hour <= 16) {
    image.src = './images/good-afternoon.png';
  } else if (hour >= 17 && hour <= 20) {
    image.src = './images/good-evening.png';
  } else {
    image.src = './images/good-night.png';;
  }
}  //* TS: 1:05

  
  
  
  
