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
	        message: "Please wait while you are redirected to the recalculate process.", 
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
    }

    return {
       redirecToRecal:redirectToRecal
    };
    
});
