
let actionItemsUtils = new ActionItems();



chrome.contextMenus.create({
  "id" : "linkSiteMenu",
  "title": "Link site for later",
  "contexts": ["all"]  
});

chrome.runtime.onInstalled.addListener((details)=>{
  if(details.reason == "install"){
    console.log("On installed")
    chrome.storage.sync.set({
      actionItems: []
    })
  }
})


chrome.contextMenus.onClicked.addListener((info, tab) => {
  if(info.menuItemId == "linkSiteMenu") {
      actionItemsUtils.addQuickActionItem("quick-action-2", "Read this site", tab, ()=>{
        actionItemsUtils.setProgress();
        console.log("we are done");
      });
    } 
  })