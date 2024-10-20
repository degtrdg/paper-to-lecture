from vapi_python import Vapi

def initialize_vapi():
    vapi_client = Vapi(api_key='d12dbf20-f0fa-487c-b49f-bcd37363bc67')
    return vapi_client

def provide_context(vapi_client, context):
    vapi_client.add_message(role="system", content=context)

def chat_with_vapi(vapi_client, user_message):
    vapi_client.add_message(role="user", content=user_message)
    response = vapi_client.chat()
    return response

def main():
    vapi_client = initialize_vapi()
    
    context = "You are a helpful AI assistant with knowledge about various topics."
    provide_context(vapi_client, context)
    
    while True:
        user_input = input("You: ")
        if user_input.lower() == 'exit':
            break
        
        response = chat_with_vapi(vapi_client, user_input)
        print("AI:", response)

if __name__ == "__main__":
    main()
