/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
define(['N/url'],
function(url) {
	function saveRecord(scriptContext) {
      
    }
  
	function callPrintingSuitelet(pjid){
	   try{
			/******* loading the Suitelet script(CPM_PrintJob_PDF_Layout_su_script.js)  *******/
		   var output = url.resolveScript({
			    scriptId: 'customscript_cpm_su_printjob_print',
			    deploymentId: 'customdeploy_cpm_printjob_print',
			    returnExternalUrl: false
			});  

			/******* open a window in new tab to showing the PDF view  *******/
			 window.open(output + '&recordId=' + pjid,'_blank');

	   }catch(e){
		   console.log('Exception:    ' + e);
	   }
	   
   }
   
    return {
      saveRecord: saveRecord,
    	callPrintSuitelet: callPrintingSuitelet
    	};
    
});
