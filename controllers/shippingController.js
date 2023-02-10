import { Shipping } from '../models/index.js';
import CustomErrorHandler from '../services/CustomErrorHandler.js';
import axios from 'axios';

const shippingController = {
    async store(req, res, next) {
        const { sender, recipient, addons } = req.body;

        let document;
        try {
            document = await Shipping.create({
                sender,
                recipient,
                'packages': req.body.packages,
                addons
            });
        } catch (err) {
            return next(err);
        }
        res.status(201).json(document);
    },

    async setPaymentLink(req, res, next) {
        const { link } = req.body;

        let document;
        try {
            document = await Shipping.findOneAndUpdate(
                { _id: req.params.id },
                { paymentLink: link },
                { new: true }
            )
        } catch (err) {
            return next(err);
        }
        res.status(201).json(document);
    },

    async show(req, res, next) {
        let document;
        try {
            document = await Shipping.findOne({ _id: req.params.id }).select(
                '-updatedAt -__v'
            );
        } catch (err) {
            return next(CustomErrorHandler.serverError());
        }
        return res.json(document);
    },
    async orders(req, res, next) {
        let document;
        try {
            document = await Shipping.find({ userid: req.params.id }).select(
                '-updatedAt -__v'
            );
        } catch (err) {
            return next(CustomErrorHandler.serverError());
        }
        return res.json(document);
    },
    async shippingRate(req, res) {
        const { recipient, packages, sender, addons } = req.body;
        const { postal_code: recieverPostal, country: reveiverCountry, } = recipient
        const { country: senderCountry, } = sender
        const requestedPackageLineItems = packages.map(p => {
            return {
                weight: {
                    units: "LB",
                    value: p.box.weight
                },
                dimensions: {
                    length: p.box.length,
                    width: p.box.width,
                    height: p.box.height,
                    units: "IN"
                }
            };
        });
        const shippingData = {
            "accountNumber": {
                "value": "740561073"
            },
            "requestedShipment": {
                "shipper": {
                    "address": {
                        "postalCode": "569933",
                        "countryCode": senderCountry
                    }
                },
                "recipient": {
                    "address": {
                        "postalCode": recieverPostal,
                        "countryCode": reveiverCountry
                    }
                },
                "pickupType": "DROPOFF_AT_FEDEX_LOCATION",
                "rateRequestType": [
                    "LIST",
                    "ACCOUNT"
                ],
                "requestedPackageLineItems": requestedPackageLineItems
            }
        }
        try {
            const authResponse = await axios.post("https://apis-sandbox.fedex.com/oauth/token", {
                'grant_type': 'client_credentials',
                'client_id': 'l70f3e6df0762e4c41a434757ed1199041',
                'client_secret': '82b381fbe43c4c09ae1ca05db25eb5f3'
            },
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                });

            const accessToken = authResponse.data.access_token;
            console.log("Access", accessToken)
            const rateResponse = await axios.post("https://apis-sandbox.fedex.com/rate/v1/rates/quotes",
                shippingData,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                    }
                }
            );
            const shippingRate = rateResponse.data.output.rateReplyDetails[0].ratedShipmentDetails[0].totalNetFedExCharge;
            res.json({ shippingRate });
        } catch (error) {
            console.log(error);
            res.json(error)
        }
    }
};

export default shippingController;
