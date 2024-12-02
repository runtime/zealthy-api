const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });

const dynamodb = new AWS.DynamoDB.DocumentClient();
const dynamodbTableName = process.env.TABLE_NAME;

exports.handler = async function (event) {
    console.log('[handler] event.httpMethod:', event.httpMethod);
    console.log('[handler] event.path:', event.path);
    console.log('[handler] event.resource:', event.resource);
    console.log('[handler] event.pathParameters:', event.pathParameters);

    let response;

    try {
        switch (true) {
            case event.httpMethod === 'GET' && event.resource === '/users':
                response = await getUsers();
                break;

            case event.httpMethod === 'GET' && event.resource === '/users/{id}':
                const getUserId = event.pathParameters.id;
                response = await getUser(getUserId);
                break;

            case event.httpMethod === 'POST' && event.resource === '/users':
                response = await createUser(event);
                break;

            case event.httpMethod === 'PUT' && event.resource === '/users/{id}':
                // Correctly extract 'id' from path parameters
                const updateUserId = event.pathParameters.id;
                response = await updateUser(event, updateUserId);
                break;

            default:
                response = buildResponse(404, { message: '404 Not Found' });
        }
    } catch (error) {
        console.error('[handler] Error:', error);
        response = buildResponse(500, { message: 'Internal Server Error', error: error.message });
    }

    return response;
};

async function getUsers() {
    const params = { TableName: dynamodbTableName };

    try {
        const data = await dynamodb.scan(params).promise();
        return buildResponse(200, data);
    } catch (error) {
        console.error('[getUsers] Error:', error);
        return buildResponse(500, { message: 'Failed to fetch users', error: error.message });
    }
}

async function getUser(id) {
    const params = { TableName: dynamodbTableName, Key: { id } };

    try {
        const data = await dynamodb.get(params).promise();
        return buildResponse(200, data.Item || { message: 'User not found' });
    } catch (error) {
        console.error('[getUser] Error:', error);
        return buildResponse(500, { message: 'Failed to fetch user', error: error.message });
    }
}

async function createUser(event) {
    const requestJSON = JSON.parse(event.body);

    const user = {
        id: requestJSON.id,
        email: requestJSON.email,
        password: requestJSON.password,
        firstName: requestJSON.firstName || '',
        lastName: requestJSON.lastName || '',
        street: requestJSON.street || '',
        city: requestJSON.city || '',
        usersstate: requestJSON.usersstate || '',
        zip: requestJSON.zip || '',
        about: requestJSON.about || '',
    };

    const params = { TableName: dynamodbTableName, Item: user };

    try {
        await dynamodb.put(params).promise();
        return buildResponse(200, user);
    } catch (error) {
        console.error('[createUser] Error:', error);
        return buildResponse(500, { message: 'Failed to create user', error: error.message });
    }
}

async function updateUser(event, id) {
    // Parse updates from the request body
    const updates = JSON.parse(event.body);

    // Extract the id and exclude it from the updates
    const { id: userId, ...updateFields } = updates;

    if (!Object.keys(updateFields).length) {
        return buildResponse(400, { message: 'Invalid request: No fields to update provided.' });
    }

    // Dynamically build the update expression
    const updateExpressions = Object.keys(updateFields)
        .map((key, idx) => `${key} = :val${idx}`)
        .join(', ');

    const expressionAttributeValues = Object.entries(updateFields).reduce(
        (acc, [key, value], idx) => ({ ...acc, [`:val${idx}`]: value }),
        {}
    );

    // DynamoDB update parameters
    const params = {
        TableName: dynamodbTableName,
        Key: { id }, // Ensure the id is used as the key
        UpdateExpression: `SET ${updateExpressions}`,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'UPDATED_NEW',
    };

    try {
        // Perform the update
        const { Attributes } = await dynamodb.update(params).promise();
        return buildResponse(200, Attributes); // Return updated attributes
    } catch (error) {
        console.error('[updateUser] Error:', error);
        return buildResponse(500, { message: 'Failed to update user', error: error.message });
    }
}




const buildResponse = (statusCode, body) => {
    return {
        statusCode,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': '*',
        },
        body: JSON.stringify(body),
    };
}
