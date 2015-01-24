var page = JSON.parse(document.body.innerText);
var putMessage = {put:"thisPage",options:{slug: page.title.replace(/\s/g, '-').replace(/[^A-Za-z0-9-]/g, '').toLowerCase(), page:page}}
chrome.runtime.sendMessage(putMessage, function(err, res){
  console.log("got response from putPage", err, res, putMessage)
  var a = document.createElement("a")
  a.href = "chrome-extension://" + chrome.i18n.getMessage("@@extension_id") +"/index.html#/view/" + putMessage.options.slug
  console.log(a)
  a.click()
})
