/**
 * @NApiVersion 2.x
 * @NModuleScope Public
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
    function pjProfitabilityReport(id)
    {
    	var output=url.resolveScript({
		    scriptId: 'customscript_cpm_suitelet_gpanalysis_rep' ,
		    deploymentId: 'customdeploy_cpm_suitelet_gpanalysis_rep',
		    returnExternalUrl: false,
		    params:{pid:id}
		});
    	window.open(output, 'Profitability Report');
    	//console.log('output',output);
    }

     return {
    	 getPrintJobProfitability: pjProfitabilityReport        
    };
    
});
