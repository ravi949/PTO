/**
 * @NApiVersion 2.x
 * @NModuleScope SameAccount
 */
define(['N/url'],

function(url) {
	
	function printDeposit(id){
		try{
			var printURL = url.resolveScript({
				scriptId: 'customscript_cpm_su_so_printdeposit',
			    deploymentId: 'customdeploy_cpm_su_so_printdeposit',
			    params :{tranid: id}
			});
			window.open(printURL, '_blank');
		} catch(ex) {
			console.log('printDeposit ERROR: ' + ex);
		}
	}
   
    return {
    	cpm_printdeposit : printDeposit
    };
    
});
