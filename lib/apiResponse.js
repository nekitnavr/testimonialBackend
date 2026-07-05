class ApiResponse {
    constructor(code = 200, status = 'success', message = '', data){
        this.code = code
        this.status = status
        this.message = message
        if (data !== undefined){
            this.data = data
        }
    }

    static success(res, message = '', data={}){
        return res.status(200).send(new ApiResponse(200, 'success', message, data))
    }

    static created(res, message = '', data={}){
        return res.status(201).send(new ApiResponse(201, 'success', message, data))
    }

    static failure(res, message = '', code = 500){
        return res.status(code).send(new ApiResponse(code, 'failure', message))
    }

    static badRequest(res, message = ''){
        return res.status(400).send(new ApiResponse(400, 'failure', message)) 
    }

    static unauthorized(res, message = ''){
        return res.status(401).send(new ApiResponse(401, 'failure', message))
    }

    static forbidden(res, message = ''){
        return res.status(403).send(new ApiResponse(403, 'failure', message))
    }

    static notFound(res, message = ''){
        return res.status(404).send(new ApiResponse(404, 'failure', message))
    }
}

module.exports = ApiResponse