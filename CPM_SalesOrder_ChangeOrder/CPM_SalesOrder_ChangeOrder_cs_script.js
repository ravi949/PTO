/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/url'],
/**
 * @param {url} url
 */
function(url) {
    
    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */
    function pageInit(scriptContext) {

    }
    function changeSalesOrder(soid){
 	   try{
 			/******* loading the Suitelet script(CPM_PrintJob_PDF_Layout_su_script.js)  *******/
 		   var output = url.resolveScript({
 			    scriptId: 'customscript_cpm_so_changeorder_su',
 			    deploymentId: 'customdeploy_cpm_so_changeorder_su',
 			    returnExternalUrl: false
 			});  
 			window.location.href = output + '&soid='+ soid;
 	   }catch(e){
 		   console.log('Exception:    ' + e);
 	   }
    }
    return {
        pageInit: pageInit,
        changeSalesOrder: changeSalesOrder
    };
    
});
