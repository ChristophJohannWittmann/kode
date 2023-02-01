/**
 * Copyright (c) 2022 Infosearch International, Reno NV
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */


/**
 * This globally available static class is just a placeholder for the instances
 * of extensions to this class.  By extending this class, each time a class is
 * constructed, it is registered in the static filters array.  Moreover, the
 * order of construction matters since there's a certain logic in the order to
 * implementing filters.
 *
global.SmtpFilter = class SmtpFilter {
    static filters = [];
    
    constructor() {
        SmtpFilter.filters.push(this);
    }
}


/**
 * The purpose of this module is to prescreen or filter all outgoing messages
 * before passing them on to the outgoing SMTP agent, AWS SES for now.  We need
 * to maintain our reputation, and this is primraily how it's done outside of
 * the SMTP agent.  Our approach is to have a framework for generic filtering.
 * When the server starts, each an array of filters is applied in the instance
 * method filterMessage().  Each filter has free reign to modify the statuses
 * of records in the SmtpOutbound message, AKA outbound.  filterMessage() then
 * assesses the result and determines how to finish up processing.  The final
 * task is to save all of the outbound records to reflect the filtering.  The
 * paragraph below provides the definition of the potential statuses and issues
 * used the records in the outbound record.
 *
 * Here's a summary of the used record statuses and issues:
 *      SmtpSend =>
 *          status: created, filtered, failed
 *          issue:  recipients, spamtrap, bounced, temporary, quota
 *
 *      SmtpRecipient =>
 *          status: created, filtered, optout, failed, spamtrap, blocked
 *
 *      SmtpAddr =>
 *          issue:  spamtrap, neverbounce, bounced, manual
 *
 *      SmtpDomain =>
 *          issue:  spamtrap, mxcheck, refused, connect, manual
 *
class Filter {
    constructor() {
        return new Promise(async (ok, fail) => {
            this.bulk = [];
            this.fast = [];
            this.busy = false;
            this.isOn = true;
            let pg = await pgConnect();
            
            for (let smtpSend of await selectPgoSmtpSend(pg, `_status='created'`)) {
                this.queue(smtpSend);
            }
            
            await pg.rollback();
            await pg.free();
            ok(this);
        });
    };
    
    async filter() {
        if (!this.busy && this.isOn) {
            this.busy = true;
            
            while (this.fast.length || this.bulk.length) {
                let smtpSend;
                
                if (this.fast.length) {
                    smtpSend = this.fast.shift();
                }
                else if (this.bulk.length) {
                    smtpSend = this.bulk.shift();
                }
            
                let outbound = await smtpOutbound(smtpSend);
                await this.filterMessage(outbound);
                
                if (this.isOn) {
                    await outbound.save();
                }
                else {
                    this.busy = false;
                    return;
                }
                
                if (outbound.record.status == 'filtered') {
                    sendPrimary({ category: 'SmtpFiltered', smtpSend: outbound.record.id });
                }
            }
            
            this.busy = false;
        }
    }
    
    async filterMessage(outbound) {
        for (let filter of SmtpFilter.filters) {
            if (this.isOn) {
                await filter.exec(outbound);
                
                if (outbound.record.status != 'created') {
                    break;
                }
                
                if (outbound.createdRecipients().length == 0) {
                    break;
                }
            }
        }
        
        if (this.isOn) {
            if (outbound.record.issue == 'spamtrap') {
                outbound.recipients.forEach(recipient => {
                    if (recipient.status == 'created') {
                        recipient.status = 'blocked';
                    }
                });
            }
            else if (!outbound.createdRecipients().length) {
                if (outbound.record.status == 'created') {
                    outbound.record.status = 'failed';
                    outbound.record.issue = 'recipients';
                }
            }
            
            outbound.recipients
            .filter(recipient => recipient.status == 'created')
            .forEach(recipient => recipient.status = 'filtered');
                
            if (outbound.record.status == 'created') {
                if (outbound.filteredRecipients().length > 0) {
                    outbound.record.status = 'filtered';
                }
                else {
                    outbound.record.status = 'failed';
                    outbound.record.issue = 'recipients';
                }
            }
        }
    }
    
    queue(smtpSend) {
        if (smtpSend.bulk === false) {
            this.fast.push(smtpSend);
        }
        else {
            this.bulk.push(smtpSend);
        }
        
        this.filter();
    }
}


/**
 * Initializes the SMTP filtering module.  Firstly, lets require/laod in the
 * SMTP filtering modules.  Once they have been loaded in and initialized,
 * let the SMTP sending, which is started with filtering, commence.
 *
exports.init = async function() {
    require('./filters/statusFilter.js');
    require('./filters/domainFilter.js');
    require('./filters/privacyDirectFilter.js');
    require('./filters/neverBounceFilter.js');
    
    let filtering = await (new Filter());
    
    onMessage('SmtpSpooled', async message => {
        let pg = await pgConnect();
        let smtpSend = await getPgoSmtpSend(pg, message.smtpSend);
        await pg.rollback();
        await pg.free();
        filtering.queue(smtpSend);
    });
    
    onMessage('SmtpFilterOff', message => {
        filtering.isOn = false;
    });
    
    onMessage('SmtpFilterOn', message => {
        filtering.isOn = true;
        filtering.filter();
    });
};
*/
