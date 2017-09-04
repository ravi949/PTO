/**
 * @NApiVersion 2.x
 * @NModuleScope SameAccount
 */
define(['N/ui/message',
		'N/url'
		],
/**
 * @param {message} message
 */
function(message,url) {
    
	/**
     *@description this function show a message while redirect
     */
	function displayMessage(){
		message.create({
			title: "Recalculating", 
	        message: "Please wait until we complete the recalculate process.", 
	        type: message.Type.INFORMATION
		}).show();
	}
	
    /**
     * @param pjid 
     *
     *@description this function redirect the user to recalculation suitelets
     */
    function redirectToRecal(pjid){
    	displayMessage();
    	var suiteletURL = url.resolveScript({
    		scriptId: 'customscript_cpm_pj_recalsuitelet3',
    		deploymentId: 'customdeploy_cpm_pj_recalsuitelet3',
    		returnExternalUrl: false
    	});
    	window.location.href = window.origin+''+suiteletURL+'&pjid='+pjid;
    }

    return {
       redirecToRecal:redirectToRecal
    };
    
});
