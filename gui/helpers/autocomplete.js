/*****
 * Copyright (c) 2017-2022 Christoph Wittmann, chris.wittmann@icloud.com
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
*****/


/*****
 * Base value for derived for data-entry widgets such as InputWidget, TextArea,
 * and Select.  It's really just an abstract class that should never be
 * directly created and is only mean to be a base class for widgets that create
 * and wrap this specific list of standard HTML input types.
*****/
register(class AutoCompleteHelper extends Helper {
    static autoCompleteEnum = mkStringSet(
        'additional-name',
        'address-level1',
        'address-level2',
        'address-level3',
        'address-level4',
        'address-line1',
        'address-line2',
        'address-line3',
        'bday',
        'bday-day',
        'bday-month',
        'bday-year',
        'cc-additional-name',
        'cc-csc',
        'cc-exp',
        'cc-exp-month',
        'cc-exp-year',
        'cc-family-name',
        'cc-given-name',
        'cc-name',
        'cc-number',
        'cc-type',
        'country',
        'country-name',
        'current-password',
        'email',
        'family-name',
        'given-name',
        'honorific-prefix',
        'honorific-suffix',
        'impp',
        'language',
        'name',
        'new-password',
        'nickname',
        'off',
        'on',
        'one-time-code',
        'organization',
        'organization-title',
        'photo',
        'postal-code',
        'sex',
        'street-address',
        'tel',
        'tel-area-code',
        'tel-country-code',
        'tel-extension',
        'tel-local',
        'tel-national',
        'transaction-amount',
        'transaction-currency',
        'url',
        'username',
    );

    constructor(widget) {
        super(widget);
    }

    helperGetAutoComplete() {
        return this.getAttribute('autocomplete');
    }

    helperSetAutoComplete(value) {
        if (typeof value == 'string' && AutoCompleteHelper.autoCompleteEnum.has(value)) {
            this.setAttribute('autocomplete', value);
        }
    }
});
