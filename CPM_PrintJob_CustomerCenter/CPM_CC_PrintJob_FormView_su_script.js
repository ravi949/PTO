/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * it renders the form view on netsuite page.
 */
define(['N/ui/serverWidget',
        'N/record',
        'N/redirect',
        'N/runtime',
        'N/search',
        'N/format',
        'N/cache'
        ],

function(serverWidget,record,redirect,runtime,search,format,cache) {
   
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
    function onRequest(context) {
    	var request = context.request,response = context.response,scriptObj = runtime.getCurrentScript(),
    	myCache = cache.getCache({
    	    name: 'temporaryCache',
    	    scope: cache.Scope.PRIVATE
    	});

    	switch(request.method){
    	case 'GET':
    		renderPage();
    		break;
    	case 'POST':
    		createPrintJob();
    		break;
    	}
    	
    	//render the new form.
    	function renderPage(){
    		var messageObj = JSON.parse(myCache.get({key:'pj-message'})),
    		form = serverWidget.createForm({
    		    title : 'Print Job Form'
    		});
    		
    		//it is used to show the flash message on suitelet after record is submit.
    		if(messageObj){
        		form.addFieldGroup({
        			id : 'cpm_status_message',
        			label : 'status message'
        		}).isBorderHidden = true;
    			form.addField({
        		    id : 'cpm_pjmessage',
        		    type : serverWidget.FieldType.INLINEHTML,
        		    label : 'message',
        		    container:'cpm_status_message'
        		}).defaultValue = '<div id="div__alert" style="width:1800px"><div class="uir-alert-box '+messageObj.type+' session_confirmation_alert" width="100%" role="status"><div class="icon '+messageObj.type+'"><img src="/images/icons/messagebox/icon_msgbox_'+messageObj.type+'.png" alt=""></div><div class="content"><div class="title">'+messageObj.type+'</div><div class="descr">'+messageObj.message+'</div></div></div></div>'
    		}
    		
    		myCache.remove({key:'pj-message'});
    		
    		form.addFieldGroup({
    			id : 'cpm_primaryinfo',
    			label : 'Primary Information'
    		});
    		
    		form.addFieldGroup({
    			id : 'cpm_impdates',
    			label : 'Important Dates'
    		});
    			
    			
    		var titleDescription = form.addField({
				id: 'cpm_title_descptn',	
				type: serverWidget.FieldType.TEXT,
				label: 'Title / Description',
				container:'cpm_primaryinfo'
			}),
			project = form.addField({
				id: 'cpm_project',	
				type: serverWidget.FieldType.TEXT,
				label: 'Project #',
				container:'cpm_primaryinfo'
			}),
			estQuantity = form.addField({
				id: 'cpm_estquantity',	
				type: serverWidget.FieldType.INTEGER,
				label: 'Estimated Quantity',
				container:'cpm_primaryinfo'
			}),
			brcQuantity = form.addField({
				id: 'cpm_brcquantity',	
				type: serverWidget.FieldType.INTEGER,
				label: 'BRC Quantity',
				container:'cpm_primaryinfo'
			}),
			format = form.addField({
				id: 'cpm_format',	
				type: serverWidget.FieldType.SELECT,
				label: 'Format',
				source:'customlist_cpm_printformats',
				container:'cpm_primaryinfo'
			}),
			pageCount = form.addField({
				id: 'cpm_pagecount',	
				type: serverWidget.FieldType.SELECT,
				label: 'Page Count',
				source:'customlist_cpm_formatpagecount',
				container:'cpm_primaryinfo'
			}),
			jobSpecs = form.addField({
				id: 'cpm_jobspecs',	
				type: serverWidget.FieldType.TEXTAREA,
				label: 'JOB specs',
				container:'cpm_primaryinfo'
			}),
			fileDueDate = form.addField({
				id: 'cpm_files_duedate',	
				type: serverWidget.FieldType.DATE,
				label: 'Files Due Date',
				container:'cpm_impdates'
			}),
			bindDate = form.addField({
				id: 'cpm_binddate',	
				type: serverWidget.FieldType.DATE,
				label: 'Bind Date',
				container:'cpm_impdates'
			}),
			inHomeDate = form.addField({
				id: 'cpm_inhome_date',	
				type: serverWidget.FieldType.DATE,
				label: 'In-home date',
				container:'cpm_impdates'
			}),
			proofDeadline = form.addField({
				id: 'cpm_proof_deadline',	
				type: serverWidget.FieldType.DATE,
				label: 'Proof Deadline',
				container:'cpm_impdates'
			}),
			printDate = form.addField({   
				id: 'cpm_printdate',	
				type: serverWidget.FieldType.DATE,
				label: 'Print Date',
				container:'cpm_impdates'
			}),
			shipDate1 = form.addField({
				id: 'cpm_shipdate1',	
				type: serverWidget.FieldType.DATE,
				label: 'Ship date 1',
				container:'cpm_impdates'
			}),
			shipDate2 = form.addField({
				id: 'cpm_shipdate2',	
				type: serverWidget.FieldType.DATE,
				label: 'Ship date 2',
				container:'cpm_impdates'
			});

			brcQuantity.isMandatory  = titleDescription.isMandatory = estQuantity.isMandatory = pageCount.isMandatory = format.isMandatory = true;			
			bindDate.isMandatory = shipDate1.isMandatory = shipDate2.isMandatory = printDate.isMandatory = proofDeadline.isMandatory = inHomeDate.isMandatory = fileDueDate.isMandatory = true;
			
			titleDescription.setHelpText({
				help : "Enter the title for Print Job."
			});
			
			brcQuantity.setHelpText({
				help : "Enter the quantity of BRCs or inserts. The value in this field is ignored if the format selected does not include a BRC item."
			});
			
			estQuantity.setHelpText({
				help : "Enter the estimated quantity for this Print Job / Sale."
			});
			
			pageCount.setHelpText({
				help : "Select the page count of the print format."
			});
			
			format.setHelpText({
				help : "Select the format of this print job"
			});
			
			bindDate.setHelpText({
				help : "Enter the bind date for this Print Job."
			});
			
			shipDate1.setHelpText({
				help : "Enter the ship date 1 for this Print Job."
			});
			
			shipDate2.setHelpText({
				help : "Enter the ship date 2 for this Print Job."
			});
			
			printDate.setHelpText({
				help : "Enter the print date for this Print Job."
			});
			
			proofDeadline.setHelpText({
				help : "Enter the proof deadline date for this Print Job."
			});
			
			inHomeDate.setHelpText({
				help : "Enter the in-home date for this Print Job."
			});
			
			fileDueDate.setHelpText({
				help : "Enter the file due date for this Print Job."
			});
			
			form.addResetButton({
			    label : 'Reset'
			});
			
			form.addSubmitButton({
				 label : 'Submit'
			}); 
    		
    		response.writePage(form);
    	}
    	
    	//create the print job record
    	function createPrintJob(){
    		var params = request.parameters,
        	title = params.cpm_title_descptn,project = params.cpm_project,
        	pjFormat = params.cpm_format,pagecount = params.cpm_pagecount,
        	estqty = params.cpm_estquantity,brcqty = params.cpm_brcquantity,
        	vendorawrd = params.cpm_vendorawrd,memo = params.cpm_jobspecs;
    		try{
    			var recId = record.create({
            		type:record.Type.OPPORTUNITY,
            	}).setValue({
            		fieldId:'entity',
            		value:runtime.getCurrentUser().id
            	}).setValue({
            		fieldId:'custbodyvndrawarder',
            		value:scriptObj.getParameter({name:'custscript_cpm_default_vendor'})
            	}).setValue({
            		fieldId:'custbody18',
            		value:title
            	}).setValue({
            		fieldId:'custbody12',
            		value:project
            	}).setValue({
            		fieldId:'custbody_cpm_printjob_pagecount',
            		value:pagecount
            	}).setValue({
            		fieldId:'custbody_cpm_printjob_format',
            		value:pjFormat
            	}).setValue({
            		fieldId:'custbodyestqty',
            		value:estqty
            	}).setValue({
            		fieldId:'custbody_cpm_printjob_brcquantity',
            		value:brcqty
            	}).setValue({
            		fieldId:'custbodypprsupplied',
            		value:1
            	}).setValue({
            		fieldId:'memo',
            		value:memo
            	}).setValue({
            		fieldId:'custbodydtefiles',
            		value:format.parse({
            		    value: params.cpm_files_duedate,
            		    type: format.Type.DATE
            		  })
            	}).setValue({
            		fieldId:'custbodydteproof',
            		value:format.parse({
            		    value: params.cpm_proof_deadline,
            		    type: format.Type.DATE
            		  })
            	}).setValue({
            		fieldId:'custbodydteprint',
            		value:format.parse({
            		    value:params.cpm_printdate,
            		    type: format.Type.DATE
            		  })
            	}).setValue({
            		fieldId:'custbodydtebind',
            		value:format.parse({
            		    value:params.cpm_binddate,
            		    type: format.Type.DATE
            		  })
            	}).setValue({
            		fieldId:'custbodydteship1',
            		value:format.parse({
            		    value:params.cpm_shipdate1,
            		    type: format.Type.DATE
            		  })
            	}).setValue({
            		fieldId:'custbodydteship2',
            		value:format.parse({
            		    value:params.cpm_shipdate2,
            		    type: format.Type.DATE
            		  })
            	}).setValue({
            		fieldId:'custbodydteiinhome',
            		value:format.parse({
            		    value:params.cpm_inhome_date,
            		    type: format.Type.DATE
            		  })
            	}).save({
            		enableSourcing:false,
            		ignoreMandatoryFields:true
            	});
        		
//        		redirect.toSuitelet({
//    				scriptId:scriptObj.getParameter({name:'custscript_cpm_pj_recordview_suid'}),
//    				deploymentId:scriptObj.getParameter({name:'custscript_cpm_pj_recordview_dpid'}),
//    				parameters:{pjid:recId}
//    			});
    			log.debug('recId',recId)
    			redirect.toSuitelet({
    				scriptId : 'customscript_cpm_pjautomation_v2_s1',
    				deploymentId : 'customdeploy_cpm_pjautomation_v2_s1',
    				parameters : {
    					'pjid' : recId,
    					'from':'cc'
    				}
    			});
        		
        		return;
    		}catch(e){
    			myCache.put({key:'pj-message',value:{type:'error',message:e.message},ttl:300});
    		}
    		
        	redirect.toSuitelet({
        		 scriptId: scriptObj.id ,
        		 deploymentId: scriptObj.deploymentId
        	});
    	}
    	
    	
    }

    return {
        onRequest: onRequest
    };
    
});
