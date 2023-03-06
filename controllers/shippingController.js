import { Shipping } from '../models/index.js';
import Easypost from "@easypost/api"
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
        const api = new Easypost("EZTK4d90317c82684615b17ae2d38ba3f34dLuRIWaCNIusd68mHk43qLA");
        const { recipient, packages, sender, addons } = req.body;

        const { postal_code: recieverPostal, country: reveiverCountry, } = recipient
        const { weight, length, width, height } = packages[0].box
        // console.log(typeof(weight))

        const { country: senderCountry, } = sender
        const shipment = new api.Shipment({
            to_address: {
                name: 'Dr. Steve Brule',
                street1: '179 N Harbor Dr',
                city: 'Redondo Beach',
                state: 'CA',
                zip: recieverPostal,
                country: reveiverCountry,
                email: 'dr_steve_brule@gmail.com',
                phone: '4155559999',
            },
            from_address: {
                street1: '417 montgomery street',
                street2: 'FL 5',
                zip: '408571',
                country: 'SG',
                company: 'EasyPost',
                phone: '415-123-4567',
            },
            parcel: {
                weight: +weight,
                length: +length,
                width: +width,
                height: +height,
            },
            carrier_id: "ca_084f492327304c4792f28f7dd04b7a81"

        });

        shipment.save().then(s => res.json(console.log("server", s))).catch(err => console.log(err))

    }
};

//     );
// const shippingRate = rateResponse.data.output.rateReplyDetails[0].ratedShipmentDetails[0].totalNetFedExCharge;
//     res.json({ shippingRate });
// } catch(error) {
//     // console.error(error);
//     res.status(500).json(error)
// }


export default shippingController;
