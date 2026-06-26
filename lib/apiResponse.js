class ApiResponse {
    constructor(code = 200, status = 'success', message = '', data = {}){
        this.code = code
        this.status = status
        this.message = message
        this.data = data
    }

    static success(message = '', data={}){
        return new ApiResponse(200, 'success', message, data)
    }

    static failure(res, message = '', data={}, code = 500){
        return res.status(code).send(new ApiResponse(code, 'failure', message, data))
    }

    static created(message = '', data={}){
        return new ApiResponse(201, 'success', message, data)
    }

    static badRequest(res, message = '', data={}){
        return res.status(400).send(new ApiResponse(400, 'failure', message, data)) 
    }

    static unauthorized(res, message = '', data={}){
        return res.status(401).send(new ApiResponse(401, 'failure', message, data))
    }

    static forbidden(res, message = '', data = {}){
        return res.status(403).send(new ApiResponse(403, 'failure', message, data))
    }

    static notFound(res, message = '', data = {}){
        return res.status(404).send(new ApiResponse(404, 'failure', message, data))
    }
}

module.exports = ApiResponse