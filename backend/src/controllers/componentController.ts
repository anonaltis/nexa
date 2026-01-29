import { Request, Response } from 'express';
import Component from '../models/Component';

export const getComponents = async (req: Request, res: Response) => {
    const { q, category, limit } = req.query;
    try {
        const filter: any = {};
        if (q) {
            filter.$or = [
                { name: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
                { tags: { $in: [new RegExp(q as string, 'i')] } }
            ];
        }
        if (category) {
            filter.category = category;
        }

        const components = await Component.find(filter).limit(Number(limit) || 50);
        res.status(200).json(components);
    } catch (error) {
        res.status(500).json({ detail: 'Error fetching components' });
    }
};

export const getCategories = async (req: Request, res: Response) => {
    try {
        const categories = await Component.aggregate([
            { $group: { _id: "$category", count: { $sum: 1 } } },
            { $project: { name: "$_id", count: 1, _id: 0 } }
        ]);
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ detail: 'Error fetching categories' });
    }
};

export const seedComponents = async (req: Request, res: Response) => {
    try {
        const count = await Component.countDocuments();
        if (count > 0) {
            return res.status(200).json({ message: 'Database already has components' });
        }

        const initialComponents = [
            {
                name: "ATMega328P",
                category: "Microcontroller",
                description: "8-bit AVR Microcontroller",
                specs: { manufacturer: "Microchip", package: "TQFP-32", price: 2.50 },
                tags: ["avr", "arduino", "mcu"]
            },
            {
                name: "ESP32-WROOM-32E",
                category: "Microcontroller",
                description: "Wi-Fi + BT + BLE MCU module",
                specs: { manufacturer: "Espressif", package: "Module", price: 4.00 },
                tags: ["wifi", "bluetooth", "esp32", "iot"]
            },
            {
                name: "LM358",
                category: "IC",
                description: "Low-Power Dual Operational Amplifier",
                specs: { manufacturer: "TI", package: "SOIC-8", price: 0.20 },
                tags: ["opamp", "analog", "ic"]
            },
            {
                name: "10k Resistor",
                category: "Resistor",
                description: "10k Ohm 1/4W Resistor",
                specs: { package: "0805", price: 0.01 },
                tags: ["resistor", "passive"]
            }
        ];

        await Component.insertMany(initialComponents);
        res.status(201).json({ message: 'Database seeded successfully' });
    } catch (error) {
        res.status(500).json({ detail: 'Error seeding database' });
    }
};
