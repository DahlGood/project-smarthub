export {};

const knex = require('./connection');

/*
    Use: Adds a new profile.
    Params: user_id, profile_name.
*/
function addProfile(userId: number, profileName: string) {

    return knex("profiles")
    .insert({
        user_id: userId,
        profile_name: profileName,
    })
    .returning("*")
    .then((rows: any) => {
        return rows[0];
    });
}

/*
    Use: Returns all profiles belonging to a user.
    Params: user_id
*/
function getProfiles(userId: number) {
    return knex("profiles")
        .select("profile_id", "user_id", "profile_name")
        .where("user_id", userId)
        .then((rows: any) => {
            return rows;
        });
}

function getUserInfo(userId: number) {
    return knex({p: "profiles"})
        .select("profile_name", "user_email")
        .join({u: "users"}, "p.user_id", "=", "u.user_id")
        .where("u.user_id", userId)
        .then((rows: any) => {
            return rows;
        });
}

/*
    Use: Returns a profile id belonging to a profile.
    Params: users email, profile name
    --below is not needed for profiles
*/
// function getProfileID(userEmail: string, profileName: string) {
//     return knex("profiles").select("profile_id").where(function(this:any) {
//         this.where("user_email", userEmail).andWhere("profile_name", profileName);
//     }).then((row: any) => {
//         return row[0];
//     });
// }

/*
    Use: Deletes a profile.
    Params: profile_id
*/
function deleteProfile(profileId: number) {
    return knex("profiles")
        .where("profile_id", profileId)
        .del()
        .then((rows: any) => {
            return rows;
        });
}

module.exports = {
    addProfile,
    getProfiles,
    getUserInfo,
    deleteProfile
}