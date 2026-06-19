import urllib.request
import urllib.error

url = "https://res.cloudinary.com/dr3vwa1uq/image/upload/v1781848723/crm_tenant_96722/sirwfpvbl4qj9fsa1hpy.pdf"
try:
    urllib.request.urlopen(url)
except urllib.error.HTTPError as e:
    print(e.read().decode('utf-8'))
