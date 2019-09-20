from django.conf.urls import url
from . import views


urlpatterns = [
    url(r"^sh1/schedH1$", views.schedH1, name="schedH1"),
    url(r"^sh2/schedH2$", views.schedH2, name="schedH2"),
    url(r"^sh3/schedH3$", views.schedH3, name="schedH3"),
    url(r"^sh4/schedH4$", views.schedH4, name="schedH4"),
    url(r"^sh5/schedH5$", views.schedH5, name="schedH5"),
    url(r"^sh6/schedH6$", views.schedH6, name="schedH6"),
]
