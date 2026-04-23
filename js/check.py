import subprocess

try:
    with open('js/app.js', 'r', encoding='utf-8') as f:
        code = f.read()
    
    # Just a quick check for obvious errors using node if possible, 
    # but since node isn't there, we can use python's js2py or just look manually.
    print("Code length:", len(code))
    
except Exception as e:
    print(e)
