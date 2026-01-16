'use server'

import { connectToDatabase } from "@/database/mongoose";
import { count } from "console";

export const getAllUsersForNewsEmail = async () => {
    try {
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;
        if(!db) throw new Error('MongoDB connection not found');
        const users = await db.collection('user').find(
            {email: {$exists: true, $ne: null}},
            {projection:{_id:1,id:1,name:1,email:1,country:1}}).toArray();
        return users.filter((user) => user.email && user.name).map((user) => ({
            id: user.id || user._id?.toString() ||'',
            name: user.name,
            email: user.email
        }));
    } catch (e) {
        console.error('Error getting users for news email',e);
        return []
    }
}