var request = require('superagent');
var card = require('../library/card.js');

var querystring = {};

if ( typeof location !== 'undefined' ) {
    location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m, k, v) {
        querystring[k] = v;
    });
}

var processors = {
    bsd: {
        fields: {
            amount: 'amount',
            amountOther: 'amount_other',
            amountToggle: 'amount_toggle',
            firstName: 'firstname',
            lastName: 'lastname',
            email: 'email',
            phone: 'phone',
            addressStreet1: 'addr1',
            addressStreet2: 'addr2',
            addressCity: 'city',
            addressState: 'state_cd',
            addressPostal: 'zip',
            addressCountry: 'country',
            cardNumber: 'cc_number',
            cardCVC: 'cc_cvv',
            cardExpires: 'cardExpires',
            expiresMonth: 'cc_expir_month',
            expiresYear: 'cc_expir_year'
        },

        action: 'https://' + global.rsd.options.slug + '/page/cde/Api/Charge/v1',

        submit: function( form, callback ) {
            var values = {};
            var self = this;
            var fields = this.fields;

            // Set up formatted expiration date
            var expires = {
                year: '',
                month: ''
            };

            if ( typeof form.fields[ fields.cardExpires ] !== 'undefined' ) {
                if ( form.fields[ fields.cardExpires ].value !== '' ) {
                    expires = card.expiration( form.fields[ fields.cardExpires ].value );
                }
            }

            // Use our fancy expiration date field
            form.fields[ fields.expiresMonth ] = { value: expires.month };
            form.fields[ fields.expiresYear ] = { value: expires.year };

            // Figure out type of card so BSD knows
            var brand;
            var brand_long = card.brand( form.fields[ fields.cardNumber ].value );

            if ( brand_long ) {
                switch( brand_long.type ) {
                    case 'amex':
                        brand = 'ax';
                        break;

                    case 'visa':
                        brand = 'vs';
                        break;

                    case 'discover':
                        brand = 'ds';
                        break;

                    case 'mastercard':
                        brand = 'mc';
                        break;
                }
            }

            // BSD Specific required [hidden] fields
            form.fields.cc_type_cd = { value: brand };
            form.fields.slug = { value: global.rsd.options.formid };
            form.fields.amount_other = { value: form.fields.amount_toggle.value || form.fields.amount_other.value };
            form.fields.amount = { value: 'other' };
            form.fields.country = { value: 'US' };

            if ( global.rsd.options.debug ) {
                form.fields.nomin = { value: 1 };
            }

            // Put values into a qs-able object
            for ( var i in form.fields ) {
                var field = form.fields[i];
                values[ i ] = field.value;
            }

            request.post( this.action )
                .type( 'form' )
                .send( values )
                .timeout( 30000 )
                .on('error', function( error ) {
                    // BSD tends to just timeout on situations where cards should be
                    // declined, ie an obviously fake testing card.
                    global.rsd.options.onFailedDonation( 'Your card was declined' );

                    callback( true, [], 'Your card was declined' );
                })
                .end(function( error, res ) {
                    var response = JSON.parse( res.text );

                    if ( response.status === 'success' ) {
                        if ( typeof callback === 'function' ) {
                            callback( false, response.reporting_data.td );
                        }

                        if ( typeof global.rsd.options.onSuccessfulDonation === 'function' ) {
                            var amount = response.reporting_data.td.transaction_amt;
                            var transaction = response.reporting_data.td.contribution_key;

                            global.rsd.options.onSuccessfulDonation( amount, transaction );
                        }
                    } else {
                        // Handle Card Declined
                        if ( response.code === 'gateway' ) {
                            global.rsd.options.onFailedDonation( 'Your card was declined' );

                            callback( true, [], 'Your card was declined' );
                        } else if ( response.field_errors ) {
                            var errorsList = [];

                            for ( var i in response.field_errors ) {
                                var field = response.field_errors[i];

                                switch ( field.field ) {
                                    case 'amount_group':
                                        field.field = 'amount_other';
                                        break;
                                }

                                errorsList.push({
                                    field: field.field,
                                    message: field.message === 'required field' ? '' : field.message
                                });
                            }

                            callback( true, errorsList );
                        } else {
                            callback( true, [] );
                        }

                        if ( typeof global.rsd.options.onFailedDonation === 'function' ) {
                            global.rsd.options.onFailedDonation( 'An error has occurred' );
                        }
                    }
                });
        }
    },
    stripe: {
        fields: {
            amount: 'amount',
            amountOther: 'amountOther',
            amountToggle: 'amountToggle',
            fullName: 'name',
            firstName: 'firstName',
            lastName: 'lastName',
            email: 'email',
            phone: 'phone',
            addressStreet1: 'address_line1',
            addressStreet2: 'address_line2',
            addressCity: 'address_city',
            addressState: 'address_state',
            addressPostal: 'address_zip',
            addressCountry: 'address_country',
            cardNumber: 'number',
            cardCVC: 'cvc',
            cardExpires: 'cardExpires',
            expiresMonth: 'exp_month',
            expiresYear: 'exp_year'
        }
    },
    // http://open.convio.com/api/apidoc/reference/methods/donate_method.html
    convio: {
        fields: {
            amount: 'amount',
            amountOther: 'other_amount',
            amountToggle: 'level_id',
            monthly: 'level_autorepeat',
            firstName: 'billing.name.first',
            lastName: 'billing.name.last',
            email: 'donor.email',
            phone: 'donor.phone',
            addressStreet1: 'billing.address.street1',
            addressStreet2: 'billing.address.street2',
            addressCity: 'billing.address.city',
            addressState: 'billing.address.state',
            addressPostal: 'billing.address.zip',
            addressCountry: 'addressCountry',
            subscribe: 'donor.email_opt_in',
            cardNumber: 'card_number',
            cardCVC: 'card_cvv',
            cardExpires: 'cardExpires',
            expiresMonth: 'card_exp_date_month',
            expiresYear: 'card_exp_date_year'
        },

        action: 'https://secure3.convio.net/' + global.rsd.options.slug + '/site/CRDonationAPI',

        submit: function( form, callback ) {
            var values = {};
            var self = this;
            var fields = this.fields;

            // Set up formatted expiration
            var expires = { year: ', month: ' };

            if ( typeof form.fields[ fields.cardExpires ] !== 'undefined' ) {
                if ( form.fields[ fields.cardExpires ].value !== '' ) {
                    expires = card.expiration( form.fields[ fields.cardExpires ].value );
                }
            }

            // Use our fancy expiration date field
            form.fields[ fields.expiresMonth ] = { value: expires.month };
            form.fields[ fields.expiresYear ] = { value: expires.year };

            form.fields.v = { value: '1.0' };
            form.fields.method = { value: 'donate' };
            form.fields.api_key = { value: global.rsd.options.apikey };
            form.fields.validate = { value: false };
            form.fields.response_format = { value: 'json' };
            form.fields.form_id = { value: global.rsd.options.formid };

            if ( typeof querystring.s_src === 'string' ) {
                console.log( 'yay' );
                console.log( querystring.s_src );
                form.fields.source = { value: querystring.s_src };
            }

            if ( typeof querystring.s_subsrc === 'string' ) {
                form.fields.sub_source = { value: querystring.s_subsrc };
            }

            if ( global.rsd.options.debug ) {
                form.fields.df_preview = { value: true };
            }

            // Put values into a qs-able object
            for ( var i in form.fields ) {
                var field = form.fields[i];
                values[ i ] = field.value;
            }

            request.post( this.action )
                .type( 'form' )
                .send( values )
                .end(function( error, res ) {

                    if ( error ) {
                        if ( typeof global.rsd.options.onFailedDonation === 'function' ) {
                            global.rsd.options.onFailedDonation( error.message );
                        }

                        callback( true, [], error.message );
                    } else {
                        var response = JSON.parse( res.text );

                        if ( response.donationResponse ) {
                            if ( typeof response.donationResponse.errors !== 'undefined' ) {
                                // Error
                                if ( typeof callback === 'function' ) {
                                    if ( response.donationResponse.errors.reason === 'CARD_DECLINED' ) {
                                        callback( true, [{ field: fields.cardNumber, message: 'Your card was declined' }] );
                                    } else if ( response.donationResponse.errors.reason === 'FIELD_VALIDATION' ) {
                                        // Setup an errors map, which we can use to assign field errors to their respective
                                        // fields within the application. Make sure these are very unique.
                                        var errorsList = [];

                                        var errorsMap = {
                                            'city': fields.addressCity,
                                            'last name': fields.lastName,
                                            'first name': fields.firstName,
                                            'CVV number': fields.cardCVC,
                                            'email address': fields.email,
                                            'Credit card number': fields.cardNumber,
                                            'street address': fields.addressStreet1,
                                            'state or province': fields.addressState,
                                            'zip or postal code': fields.addressPostal
                                        };

                                        for ( var i in response.donationResponse.errors.fieldError ) {
                                            var error = response.donationResponse.errors.fieldError[i];

                                            for ( var j in errorsMap ) {
                                                var code = errorsMap[j];

                                                if ( error.indexOf( j ) !== -1 ) {
                                                    errorsList.push({
                                                        field: code,
                                                        message: error
                                                    });
                                                }
                                            }
                                        }

                                        callback( true, errorsList );
                                    } else {
                                        callback( true, [] );
                                    }
                                }

                                if ( typeof global.rsd.options.onFailedDonation === 'function' ) {
                                    global.rsd.options.onFailedDonation( response.donationResponse.errors.message );
                                }
                            } else {
                                // Success

                                if ( typeof callback === 'function' ) {
                                    // TODO: Return standardized response to RSD
                                    callback( false, response.donationResponse.donation );
                                }

                                if ( typeof global.rsd.options.onSuccessfulDonation === 'function' ) {
                                    var amount = response.donationResponse.donation.amount.decimal;
                                    var transaction = response.donationResponse.donation.transaction_id;

                                    global.rsd.options.onSuccessfulDonation( amount, transaction );
                                }
                            }
                        } else {
                            var error = 'Could not connect to server';

                            if ( typeof global.rsd.options.onFailedDonation === 'function' ) {
                                global.rsd.options.onFailedDonation( error );
                            }

                            callback( true, [], error );
                        }
                    }
                });
        }
    }
};

module.exports = processors;
